import time
from sqlalchemy import text
from langchain_ollama import OllamaLLM
from langchain_huggingface import HuggingFaceEmbeddings
from app.config import settings
from app.database import SessionLocal

_embeddings = HuggingFaceEmbeddings(
    model_name=settings.embedding_model,
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},
)

_llm = OllamaLLM(
    base_url=settings.ollama_base_url,
    model=settings.llm_model,
    temperature=0.0,
    num_predict=500,
)

_SYSTEM_PROMPT = """Eres el asistente interno de seguridad de la organización.
Reglas:
1. Responde ÚNICAMENTE con la información del CONTEXTO.
2. Si el contexto no es suficiente, dilo claramente y NO inventes.
3. Cita cada afirmación con [n] Título vVersión — Sección.
4. No reveles contraseñas, tokens ni datos personales.
5. Si el usuario reporta un posible incidente, indícalo y ofrece crear un ticket.
Responde en español, claro y breve (máx. 200 palabras)."""

def _embed_query(q: str):
    vec = _embeddings.embed_query(q)
    return vec

from app.services import reranker

def retrieve(query: str, top_k: int | None = None, min_score: float | None = None):
    # 1. Recuperación vectorial amplia
    top_k = (top_k or settings.retrieval_top_k) * 2  # 16 candidatos si top_k=8
    min_score = min_score if min_score is not None else settings.retrieval_min_score
    vec = _embed_query(query)
    vec_literal = "[" + ",".join(f"{x:.6f}" for x in vec) + "]"

    sql = text("""
        SELECT c.id, c.content, c.section,
               d.id AS document_id, d.title, d.version, d.source_uri, d.doc_type,
               1 - (c.embedding <=> CAST(:vec AS vector)) AS score
        FROM kb_chunks c
        JOIN kb_documents d ON d.id = c.document_id
        WHERE d.status = 'active'
        ORDER BY c.embedding <=> CAST(:vec AS vector)
        LIMIT :k
    """)
    with SessionLocal() as db:
        rows = db.execute(sql, {"vec": vec_literal, "k": top_k}).mappings().all()

    hits = [dict(r) for r in rows if float(r["score"]) >= min_score]
    if not hits:
        return []

    # 2. Re-ranking cross-encoder
    hits = reranker.rerank(query, hits, top_n=settings.retrieval_top_k)
    return hits

def _build_context(hits) -> str:
    lines = []
    for i, h in enumerate(hits, start=1):
        section = h.get("section") or "General"
        lines.append(
            f"[{i}] {h['title']} v{h['version']} — {section}\n{h['content']}"
        )
    return "\n\n".join(lines)

def _fallback_answer():
    return (
        "No encontré información suficiente en las políticas internas para responder "
        "con certeza. ¿Quieres que registre un ticket para que el equipo de Seguridad "
        "te contacte?"
    )

from app.services import cache

def _kb_version() -> str:
    with SessionLocal() as db:
        v = db.execute(text("SELECT COALESCE(MAX(updated_at), now())::text FROM kb_documents")).scalar()
    return v or "v1"

def answer(question: str) -> dict:
    t0 = time.time()
    kb_v = _kb_version()

    cached = cache.get(question, kb_v)
    if cached:
        cached["cached"] = True
        cached["latency_ms"] = int((time.time() - t0) * 1000)
        return cached

    hits = retrieve(question)
    if not hits:
        result = {
            "answer": _fallback_answer(),
            "citations": [],
            "grounded": False,
            "latency_ms": int((time.time() - t0) * 1000),
            "cached": False,
        }
        cache.set(question, result, kb_v, ttl=60)  # fallback TTL corto
        return result

    context = _build_context(hits)
    prompt = f"{_SYSTEM_PROMPT}\n\nCONTEXTO:\n{context}\n\nPREGUNTA: {question}\nRESPUESTA:"
    try:
        raw = _llm.invoke(prompt).strip()
    except Exception as e:
        log.exception("LLM falló")
        raw = _fallback_answer()

    citations = [
        {"index": i + 1, "document_id": str(h["document_id"]), "title": h["title"],
         "version": h["version"], "section": h.get("section"), "source_uri": h.get("source_uri")}
        for i, h in enumerate(hits)
    ]
    result = {
        "answer": raw, "citations": citations, "grounded": True,
        "latency_ms": int((time.time() - t0) * 1000), "cached": False,
    }
    cache.set(question, result, kb_v)
    return result