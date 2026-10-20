from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from app import models

SLA_HOURS = {"P1": 1, "P2": 4, "P3": 24, "P4": 72}

def next_ticket_number(db: Session) -> str:
    seq = db.execute(text("SELECT nextval('ticket_seq')")).scalar()
    return f"TCK-{datetime.utcnow():%Y%m%d}-{seq:06d}"

def create_ticket(
    db: Session,
    *,
    title: str,
    description: str,
    category: str,
    severity: str,
    reported_by,
    chat_id=None,
    metadata: dict | None = None,
) -> models.Ticket:
    due = datetime.utcnow() + timedelta(hours=SLA_HOURS.get(severity, 72))
    t = models.Ticket(
        ticket_number=next_ticket_number(db),
        title=title[:200],
        description=description,
        category=category,
        severity=severity,
        status="nuevo",
        source="chatbot",
        chat_id=chat_id,
        reported_by=reported_by,
        due_at=due,
        metadata_=metadata or {},
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t