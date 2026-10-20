"""
Uso:
  python -m app.ingestion.ingest --file docs/politica_contrasenas.pdf \
       --title "Política de Contraseñas" --doc-type policy --version 2.1 \
       --section-split

  python -m app.ingestion.ingest --dir docs/faq/
"""
import argparse
import hashlib
import os
import uuid
from pathlib import Path

from sqlalchemy import text
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader

from app.config import settings
from app.database import SessionLocal

_embeddings = HuggingFaceEmbeddings(
    model_name=settings.embedding_model,
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},
)

def _load(path: str):
    ext = Path(path).suffix.lower()
    if ext == ".pdf":
        return PyPDFLoader(path).load()
    if ext in (".docx", ".doc"):
        return Docx2txtLoader(path).load()
    if ext in (".md", ".txt"):
        return TextLoader(path, encoding="utf-8").load()
    raise ValueError(f"Formato no soportado: {ext}")

def _split(docs, doc_type: str, section_split: bool):
    if section_split:
        headers = [("#", "h1"), ("##", "h2"), ("###", "h3")]
        md_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers)
        chunks = []
        for d in docs:
            for s in md_splitter.split_text(d.page_content):
                chunks.append(s)
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)
        return splitter.split_documents(chunks)
    if doc_type == "faq":
        splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=0,
                                                  separators=["\n\n", "\nQ:", "\nP:"])
    elif doc_type == "runbook":
        splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)
    else:
        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)
    return splitter.split_documents(docs)

def _checksum(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()

def ingest_one(path: str, title: str, doc_type: str, version: str,
               owner: str | None, section_split: bool, original_name=None):
    docs = _load(path)
    chunks = _split(docs, doc_type, section_split)
    checksum = _checksum(path)

    with SessionLocal() as db:
        # ¿Ya existe misma versión con mismo checksum?
        existing = db.execute(text("""
            SELECT id FROM kb_documents
            WHERE title = :t AND version = :v AND checksum = :c
        """), {"t": title, "v": version, "c": checksum}).first()
        if existing:
            print(f"[SKIP] {title} v{version} ya indexado")
            return

        # Marcar versiones anteriores como obsoletas
        db.execute(text("""
            UPDATE kb_documents SET status='obsolete', updated_at=now()
            WHERE title = :t AND status = 'active'
        """), {"t": title})

        doc_id = uuid.uuid4()
        db.execute(text("""
            INSERT INTO kb_documents
              (id, title, source_uri, doc_type, version, owner,
               classification, effective_date, status, checksum)
            VALUES
              (:id, :title, :uri, :dtype, :ver, :owner,
               'internal', now()::date, 'active', :checksum)
        """), {
            "id": doc_id, "title": title, "uri": path, "dtype": doc_type,
            "ver": version, "owner": owner, "checksum": checksum,
        })

        for i, c in enumerate(chunks):
            content = c.page_content.strip()
            if not content:
                continue
            vec = _embeddings.embed_query(content)
            vec_literal = "[" + ",".join(f"{x:.6f}" for x in vec) + "]"
            section = None
            if hasattr(c, "metadata"):
                section = c.metadata.get("h2") or c.metadata.get("h1") or c.metadata.get("h3")
            db.execute(text("""
                INSERT INTO kb_chunks
                  (document_id, chunk_index, content, embedding, section, metadata)
                VALUES
                  (:doc, :idx, :content, CAST(:vec AS vector), :section, '{}'::jsonb)
            """), {
                "doc": doc_id, "idx": i, "content": content,
                "vec": vec_literal, "section": section,
            })
        db.commit()
        print(f"[OK] {title} v{version} → {len(chunks)} chunks")

def ingest_dir(path: str):
    for f in Path(path).iterdir():
        if f.suffix.lower() in (".pdf", ".docx", ".doc", ".md", ".txt"):
            ingest_one(str(f), title=f.stem, doc_type="other",
                       version="1.0", owner=None, section_split=False)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--file")
    ap.add_argument("--dir")
    ap.add_argument("--title")
    ap.add_argument("--doc-type", default="other",
                    choices=["policy", "runbook", "faq", "other"])
    ap.add_argument("--version", default="1.0")
    ap.add_argument("--owner")
    ap.add_argument("--section-split", action="store_true")
    args = ap.parse_args()

    if args.dir:
        ingest_dir(args.dir)
    elif args.file and args.title:
        ingest_one(args.file, args.title, args.doc_type, args.version,
                   args.owner, args.section_split)
    else:
        ap.error("Especifica --file --title o --dir")