"""Caché de respuestas RAG en Redis.
Clave: sha256(pregunta normalizada + versión KB).
TTL configurable. Invalida al reindexar KB.
"""
import hashlib
import json
import os
import logging
import redis

log = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
CACHE_TTL = int(os.getenv("CACHE_TTL_SECONDS", "300"))

_client = None

def client() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(REDIS_URL, decode_responses=True)
    return _client

def _key(question: str, kb_version: str) -> str:
    h = hashlib.sha256(f"{question.strip().lower()}|{kb_version}".encode()).hexdigest()[:32]
    return f"rag:ans:{h}"

def get(question: str, kb_version: str = "v1"):
    try:
        raw = client().get(_key(question, kb_version))
        if raw:
            return json.loads(raw)
    except Exception as e:
        log.warning("Cache GET falló: %s", e)
    return None

def set(question: str, value: dict, kb_version: str = "v1", ttl: int = None):
    try:
        client().setex(_key(question, kb_version), ttl or CACHE_TTL, json.dumps(value))
    except Exception as e:
        log.warning("Cache SET falló: %s", e)

def invalidate_all():
    try:
        for k in client().scan_iter("rag:ans:*"):
            client().delete(k)
    except Exception as e:
        log.warning("Cache INVALIDATE falló: %s", e)