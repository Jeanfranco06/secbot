"""Memoria conversacional: historial reciente + resumen acumulado."""
import logging
from typing import Optional
from sqlalchemy.orm import Session

from app import models

log = logging.getLogger(__name__)

RECENT_TURNS = 6  # últimos 6 mensajes (3 user + 3 assistant)
SUMMARY_TRIGGER = 20  # si la conversación tiene > 20 mensajes, resumir


def load_recent(db: Session, chat_id) -> list[dict]:
    rows = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.chat_id == chat_id)
        .order_by(models.ChatMessage.created_at.desc())
        .limit(RECENT_TURNS)
        .all()
    )
    rows.reverse()
    return [{"role": r.role, "content": r.content} for r in rows if r.role in ("user", "assistant")]


def format_context(messages: list[dict], max_chars: int = 1200) -> str:
    """Formatea el historial para incluirlo en el prompt."""
    if not messages:
        return ""
    lines = []
    for m in messages[-RECENT_TURNS:]:
        prefix = "Empleado" if m["role"] == "user" else "Asistente"
        lines.append(f"{prefix}: {m['content'][:400]}")
    text = "\n".join(lines)
    return text[-max_chars:]


def needs_summary(db: Session, chat_id) -> bool:
    n = db.query(models.ChatMessage).filter(models.ChatMessage.chat_id == chat_id).count()
    return n > SUMMARY_TRIGGER


def build_summary(db: Session, chat_id) -> Optional[str]:
    """Genera resumen del chat previo. Se cachea en chat_history.metadata."""
    from langchain_ollama import OllamaLLM
    from app.config import settings

    chat = db.query(models.ChatHistory).filter(models.ChatHistory.id == chat_id).first()
    if not chat:
        return None
    if chat.metadata_ and chat.metadata_.get("summary"):
        return chat.metadata_["summary"]

    msgs = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.chat_id == chat_id, models.ChatMessage.role.in_(["user", "assistant"]))
        .order_by(models.ChatMessage.created_at.asc())
        .limit(40).all()
    )
    text = "\n".join(f"{m.role}: {m.content[:500]}" for m in msgs)

    llm = OllamaLLM(base_url=settings.ollama_base_url, model=settings.llm_model,
                    temperature=0.0, num_predict=200, timeout=settings.llm_timeout_seconds)
    try:
        summary = llm.invoke(
            "Resume en 5 líneas la siguiente conversación de soporte de seguridad, "
            "conservando decisiones, tickets creados y temas tratados:\n\n" + text[:6000]
        )
        summary = summary.strip()[:1500]
        chat.metadata_ = {**(chat.metadata_ or {}), "summary": summary}
        db.commit()
        return summary
    except Exception as e:
        log.warning("summarize_failed", extra={"err": str(e)})
        return None