"""Gestión de tickets: numeración, SLA, transiciones válidas, notificación."""
import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app import models
from app.errors import DomainError, ConflictError

log = logging.getLogger(__name__)

SLA_HOURS = {"P1": 1, "P2": 4, "P3": 24, "P4": 72}

VALID_TRANSITIONS = {
    "nuevo": {"en_progreso", "cancelado"},
    "en_progreso": {"resuelto", "cancelado"},
    "resuelto": {"cerrado", "en_progreso"},
    "cerrado": set(),
    "cancelado": set(),
}


class InvalidTransition(DomainError):
    status_code = 409
    code = "invalid_transition"


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
    metadata: Optional[dict] = None,
    tenant_id=None,
) -> models.Ticket:
    if severity not in SLA_HOURS:
        severity = "P4"
    due = datetime.utcnow() + timedelta(hours=SLA_HOURS[severity])
    t = models.Ticket(
        ticket_number=next_ticket_number(db),
        title=(title or "Incidente sin título")[:200],
        description=description,
        category=category,
        severity=severity,
        status="nuevo",
        source="chatbot",
        chat_id=chat_id,
        reported_by=reported_by,
        due_at=due,
        metadata_=metadata or {},
        tenant_id=tenant_id,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


def transition(db: Session, ticket: models.Ticket, new_status: str, user_id) -> models.Ticket:
    current = ticket.status
    allowed = VALID_TRANSITIONS.get(current, set())
    if new_status not in allowed:
        raise InvalidTransition(
            f"No se puede pasar de '{current}' a '{new_status}'",
            current=current, requested=new_status,
        )
    ticket.status = new_status
    if new_status == "resuelto":
        ticket.resolved_at = datetime.utcnow()
    elif new_status in ("cerrado", "cancelado"):
        ticket.resolved_at = ticket.resolved_at or datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket


def mark_notified(db: Session, ticket_id) -> None:
    db.execute(text("""
        UPDATE tickets
        SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"notified": true}'::jsonb
        WHERE id = :id
    """), {"id": ticket_id})
    db.commit()