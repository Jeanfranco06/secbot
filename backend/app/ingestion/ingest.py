"""Ingesta idempotente con versionado y metadatos."""
import argparse
import logging
import shutil
import tempfile
import uuid
from pathlib import Path
from typing import Optional

from langchain_huggingface import HuggingFaceEmbeddings
from sqlalchemy import text

from app.config import settings
from app.database import SessionLocal
from app.ingestion.loaders import load_document
from app.ingestion.chunkers import chunk_documents
from app.services import kb_versioning, cache

log = logging.getLogger(__name__)

_embeddings: Optional[HuggingFaceEmbeddings] = None


def _get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=settings.embedding_model,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings


def _vec_literal(vec: list[float]) -> str:
    return "[" + ",".join(f"{x:.6f}" for x in vec) + "]"


def ingest_one(
    path: str,
    title: str,
    doc_type: str,
    version: str = "1.0",
    owner: Optional[str] = None,
    section_split: bool = False,
    original_name: Optional[str] = None,
) -> dict:
    if doc_type not in {"policy", "runbook", "faq", "other"}:
        doc_type = "other"

    checksum = kb_versioning.file_checksum(path)

    with SessionLocal() as db:
        if kb_versioning.document_exists(db, title, version, checksum):
            log.info("ingest_skip_duplicate", extra={"title": title, "version": version})
            return {"doc_id": None, "title": title, "version": version,
                    "chunks": 0, "source": original_name or path, "skipped": True}

        docs = load_document(path)
        if not docs:
            raise ValueError(f"Sin contenido: {path}")
        chunks = chunk_documents(docs, doc_type, section_split)
        if not chunks:
            raise ValueError(f"Sin chunks: {path}")

        kb_versioning.obsolete_previous(db, title)

        doc_id = uuid.uuid4()
        db.execute(text("""
            INSERT INTO kb_documents
              (id, title, source_uri, doc_type, version, owner,
               classification, effective_date, status, checksum)
            VALUES
              (:id, :title, :uri, :dtype, :ver, :owner,
               'internal', now()::date, 'active', :checksum)
        """), {
            "id": doc_id, "title": title, "uri": original_name or path,
            "dtype": doc_type, "ver": version, "owner": owner, "checksum": checksum,
        })

        inserted = 0
        for i, c in enumerate(chunks):
            content = c.page_content.strip()
            if not content:
                continue
            vec = _get_embeddings().embed_query(content)
            section = None
            if hasattr(c, "metadata"):
                section = c.metadata.get("h2") or c.metadata.get("h1") or c.metadata.get("h3")
            db.execute(text("""
                INSERT INTO kb_chunks
                  (document_id, chunk_index, content, embedding, section, token_count, metadata)
                VALUES
                  (:doc, :idx, :content, CAST(:vec AS vector), :section, :tokens, '{}'::jsonb)
            """), {
                "doc": doc_id, "idx": i, "content": content,
                "vec": _vec_literal(vec), "section": section,
                "tokens": len(content.split()),
            })
            inserted += 1

        db.commit()

    kb_versioning.after_ingest()
    log.info("ingest_ok", extra={"title": title, "chunks": inserted})
    return {
        "doc_id": str(doc_id), "title": title, "version": version,
        "chunks": inserted, "source": original_name or path, "skipped": False,
    }


def ingest_dir(path: str) -> list[dict]:
    results = []
    for f in Path(path).iterdir():
        if f.suffix.lower() in (".pdf", ".docx", ".doc", ".md", ".txt", ".html", ".htm"):
            try:
                results.append(ingest_one(
                    str(f), title=f.stem, doc_type="other", version="1.0",
                    owner=None, section_split=False, original_name=f.name,
                ))
            except Exception as e:
                log.error("ingest_dir_failed", extra={"file": str(f), "err": str(e)})
    return results


def ingest_bytes(data: bytes, filename: str, title: str, doc_type: str,
                 version: str = "1.0", owner: Optional[str] = None,
                 section_split: bool = False) -> dict:
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(filename).suffix) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        return ingest_one(tmp_path, title, doc_type, version, owner, section_split, filename)
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def _cli():
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
        for r in ingest_dir(args.dir):
            print(r)
    elif args.file and args.title:
        print(ingest_one(args.file, args.title, args.doc_type, args.version,
                         args.owner, args.section_split))
    else:
        ap.error("Especifica --file --title o --dir")


if __name__ == "__main__":
    _cli()