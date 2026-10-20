"""Healthchecks por dependencia."""
import logging
import httpx
from app import database
from app.config import settings
from app.services import cache

log = logging.getLogger(__name__)


def check_database() -> dict:
    return {"ok": database.ping()}


def check_redis() -> dict:
    try:
        cache.client().ping()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "err": str(e)}


def check_ollama() -> dict:
    try:
        r = httpx.get(f"{settings.ollama_base_url}/api/tags", timeout=3)
        return {"ok": r.status_code == 200, "status": r.status_code}
    except Exception as e:
        return {"ok": False, "err": str(e)}


def check_n8n() -> dict:
    try:
        r = httpx.get(settings.n8n_webhook_url.replace("/webhook/security-incident", "/healthz"),
                      timeout=3)
        return {"ok": r.status_code < 500, "status": r.status_code}
    except Exception as e:
        return {"ok": False, "err": str(e)}


def deep() -> dict:
    checks = {
        "database": check_database(),
        "redis": check_redis(),
        "ollama": check_ollama(),
    }
    ok = all(c.get("ok") for c in checks.values())
    return {"ok": ok, "checks": checks}