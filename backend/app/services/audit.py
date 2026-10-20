from datetime import datetime
from sqlalchemy.orm import Session
from app import models

def log_action(
    db: Session,
    *,
    user_id=None,
    module: str,
    action: str,
    entity: str | None = None,
    entity_id: str | None = None,
    ip: str | None = None,
    user_agent: str | None = None,
    input_data: dict | None = None,
    output_data: dict | None = None,
    result: str = "ok",
):
    entry = models.AuditLog(
        user_id=user_id,
        module=module,
        action=action,
        entity=entity,
        entity_id=str(entity_id) if entity_id else None,
        ip=ip,
        user_agent=user_agent,
        input=input_data,
        output=output_data,
        result=result,
        created_at=datetime.utcnow(),
    )
    db.add(entry)
    db.commit()