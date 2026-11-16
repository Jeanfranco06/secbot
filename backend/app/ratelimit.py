"""Rate limiting por usuario + IP con Redis."""
import time
import os
import redis
from fastapi import Request, HTTPException

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in ("true", "1", "yes")

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = redis.from_url(REDIS_URL, decode_responses=True)
    return _client

def _check(key: str, limit: int, window: int):
    if not RATE_LIMIT_ENABLED:
        return True
    now = int(time.time())
    client = _get_client()
    pipe = client.pipeline()
    pipe.incr(key)
    pipe.expire(key, window)
    count, _ = pipe.execute()
    return count <= limit

def limit_chat(request: Request, user_id: str, limit: int = 30, window: int = 60):
    if not RATE_LIMIT_ENABLED:
        return
    key = f"rl:chat:{user_id}:{int(time.time() // window)}"
    if not _check(key, limit, window):
        raise HTTPException(status_code=429, detail="Demasiadas solicitudes")

def limit_login(request: Request, limit: int = 5, window: int = 60):
    if not RATE_LIMIT_ENABLED:
        return
    ip = request.client.host if request.client else "unknown"
    key = f"rl:login:{ip}:{int(time.time() // window)}"
    if not _check(key, limit, window):
        raise HTTPException(status_code=429, detail="Demasiados intentos de login")