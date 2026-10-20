"""Reescritura de queries para mejorar recall.
Estrategia:
- Si la pregunta es corta (< 6 palabras) o ambigua, la reescribe.
- Genera hasta 3 variantes (multi-query).
"""
import logging
from typing import List
from langchain_ollama import OllamaLLM
from app.config import settings

log = logging.getLogger(__name__)

_PROMPT = """Reescribe la siguiente pregunta de un empleado sobre seguridad interna
en 3 variantes claras y autosuficientes, en español.
Devuelve SOLO las 3 variantes, una por línea, sin numeración.

Pregunta original: {q}

Variantes:"""


def _llm() -> OllamaLLM:
    return OllamaLLM(
        base_url=settings.ollama_base_url,
        model=settings.llm_model,
        temperature=0.2,
        num_predict=200,
        timeout=settings.llm_timeout_seconds,
    )


def should_rewrite(question: str) -> bool:
    words = question.strip().split()
    if len(words) < 6:
        return True
    low = question.lower()
    ambiguous = ["eso", "esto", "aquello", "cómo", "qué hago", "ayuda", "?"]
    if any(a in low for a in ["eso", "esto", "aquello"]):
        return True
    if len(words) <= 8 and low.count("?") >= 1:
        return True
    return False


def rewrite(question: str) -> List[str]:
    """Devuelve [original, ...variantes]. Si falla, solo el original."""
    if not should_rewrite(question):
        return [question]
    try:
        raw = _llm().invoke(_PROMPT.format(q=question))
        variants = [line.strip() for line in raw.splitlines() if line.strip() and len(line.strip()) > 8]
        variants = variants[:3]
        return [question] + [v for v in variants if v.lower() != question.lower()]
    except Exception as e:
        log.warning("query_rewrite_failed", extra={"err": str(e)})
        return [question]