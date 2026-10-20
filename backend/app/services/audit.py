"""Auditoría append-only con integración SIEM y sin bloquear el request."""
import logging
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from app import models

log = logging.getLogger(__name__)

# Módulos/acciones que se reenvían al SIEM
_SIEM_EVENTS = {
    ("auth", "login"),
    ("auth", "logout"),
    ("auth", "sso_login"),
    ("admin", "user_create"),
    ("admin", "user_update"),
    ("admin", "user_deactivate"),
    ("admin", "password_reset"),
    ("admin", "role_permissions_update"),
    ("admin", "user_erase"),
    ("tickets", "update"),
    ("kb", "upload"),
    ("kb", "obsolete"),
    ("reports", "export"),
}


def _safe_json(data: Any) -> Any:
    if data is None:
        return None
    try:
        import json
        json.dumps(data)
        return data
    except Exception:
        return {"_repr": str(data)[:500]}


def log_action(
    db: Session,
    *,
    user_id=None,
    module: str,
    action: str,
    entity: Optional[str] = None,
    entity_id: Optional[str] = None,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    input_data: Optional[dict] = None,
    output_data: Optional[dict] = None,
    result: str = "ok",
    request_id: Optional[str] = None,
) -> None:
    """Inserta en audit_log. No propaga excepciones para no romper el request."""
    try:
        entry = models.AuditLog(
            user_id=user_id,
            module=module,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id else None,
            ip=ip,
            user_agent=user_agent[:255] if user_agent else None,
            input=_safe_json(input_data),
            output=_safe_json(output_data),
            result=result,
            request_id=request_id,
            created_at=datetime.utcnow(),
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        log.error("audit_insert_failed", extra={"err": str(e), "audit_module": module, "audit_action": action})
        try:
            db.rollback()
        except Exception:
            pass

    # SIEM (best effort)
    if (module, action) in _SIEM_EVENTS or result == "fail":
        try:
            from app.services import siem
            severity = "high" if result == "fail" else "info"
            siem.send_event(f"audit.{module}.{action}", severity, user_id=str(user_id) if user_id else None)
        except Exception as e:
            log.warning("siem_forward_failed", extra={"err": str(e)})