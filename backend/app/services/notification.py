"""Notificaciones centralizadas: n8n + SMTP con retry y logging."""
import logging
from typing import Optional

import httpx

from app.config import settings

log = logging.getLogger(__name__)


def _post_n8n(first, second=None, timeout: Optional[int] = None) -> bool:
    if isinstance(first, str):
        url = first
        payload = second or {}
    else:
        payload = first
        url = settings.n8n_webhook_url
    try:
        r = httpx.post(
            url,
            json=payload,
            headers={"X-N8N-Secret": settings.n8n_secret},
            timeout=timeout or settings.n8n_timeout_seconds,
        )
        if r.status_code >= 400:
            log.warning("n8n_http_error", extra={"status": r.status_code, "body": r.text[:200]})
            return False
        return True
    except Exception as e:
        log.error("n8n_post_failed", extra={"err": str(e)})
        return False


def notify_incident(
    *,
    ticket_id: str,
    ticket_number: str,
    severity: str,
    category: str,
    title: str,
    chat_id: Optional[str],
    reported_by: Optional[str],
) -> bool:
    return _post_n8n({
        "ticket_id": ticket_id,
        "ticket_number": ticket_number,
        "severity": severity,
        "category": category,
        "title": title,
        "chat_id": chat_id,
        "reported_by": reported_by,
    })

def notify_status_change(*, ticket_id: str) -> bool:
    url = settings.n8n_webhook_url.replace("security-incident", "ticket-status-changed")
    return _post_n8n(url, {"ticket_id": ticket_id}) if url else False


def notify_user_created(*, user_id: str) -> bool:
    url = settings.n8n_webhook_url.replace("security-incident", "user-created")
    return _post_n8n(url, {"user_id": user_id}) if url else False


def notify_kb_updated(*, user: str, title: str, version: str, chunks: int, action: str) -> bool:
    url = settings.n8n_webhook_url.replace("security-incident", "kb-updated")
    return _post_n8n(url, {
        "user": user, "title": title, "version": version,
        "chunks": chunks, "action": action,
    }) if url else False