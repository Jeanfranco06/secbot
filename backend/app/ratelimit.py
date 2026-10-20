"""Rate limiting por usuario + IP con Redis."""
import time
import os
import redis
from fastapi import Request, HTTPException

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
_client = redis.from_url(REDIS_URL, decode_responses=True)

def _check(key: str, limit: int, window: int):
    now = int(time.time())
    pipe = _client.pipeline()
    pipe.incr(key)
    pipe.expire(key, window)
    count, _ = pipe.execute()
    return count <= limit

def limit_chat(request: Request, user_id: str, limit: int = 30, window: int = 60):
    key = f"rl:chat:{user_id}:{int(time.time() // window)}"
    if not _check(key, limit, window):
        raise HTTPException(status_code=429, detail="Demasiadas solicitudes")

def limit_login(request: Request, limit: int = 5, window: int = 60):
    ip = request.client.host if request.client else "unknown"
    key = f"rl:login:{ip}:{int(time.time() // window)}"
    if not _check(key, limit, window):
        raise HTTPException(status_code=429, detail="Demasiados intentos de login")