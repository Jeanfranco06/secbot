import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import require_roles, get_current_user
from app.services.audit import log_action

router = APIRouter(prefix="/api/v1/tickets", tags=["tickets"])

@router.get("", response_model=list[schemas.TicketOut])
def list_tickets(
    status: str | None = None,
    user: models.User = Depends(require_roles("admin", "security_analyst")),
    db: Session = Depends(get_db),
):
    q = db.query(models.Ticket)
    if status:
        q = q.filter(models.Ticket.status == status)
    return q.order_by(models.Ticket.created_at.desc()).limit(200).all()

@router.get("/{ticket_id}", response_model=schemas.TicketOut)
def get_ticket(
    ticket_id: uuid.UUID,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    t = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return t

@router.patch("/{ticket_id}", response_model=schemas.TicketOut)
def update_ticket(
    ticket_id: uuid.UUID,
    payload: schemas.TicketUpdate,
    user: models.User = Depends(require_roles("admin", "security_analyst")),
    db: Session = Depends(get_db),
):
    t = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    changes = {}
    for field in ("status", "assigned_to", "resolution"):
        val = getattr(payload, field, None)
        if val is not None:
            setattr(t, field, val)
            changes[field] = str(val)
    db.commit()
    db.refresh(t)
    log_action(db, user_id=user.id, module="tickets", action="update",
               entity="ticket", entity_id=str(t.id), input_data=changes)
    return t