import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, require_permissions, get_user_permissions
from app.services import tickets as tickets_svc
from app.services.audit import log_action

router = APIRouter(prefix="/api/v1/tickets", tags=["tickets"])


@router.get("", response_model=list[schemas.TicketOut])
def list_tickets(
    status: str | None = None,
    severity: str | None = None,
    limit: int = 100,
    _: models.User = Depends(require_permissions("ticket.view_all")),
    db: Session = Depends(get_db),
):
    q = db.query(models.Ticket)
    if status:
        q = q.filter(models.Ticket.status == status)
    if severity:
        q = q.filter(models.Ticket.severity == severity)
    return q.order_by(models.Ticket.created_at.desc()).limit(min(limit, 500)).all()


@router.get("/{ticket_id}", response_model=schemas.TicketDetail)
def get_ticket(
    ticket_id: uuid.UUID,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    t = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    if t.reported_by != user.id:
        perms = get_user_permissions(db, user.id)
        if "ticket.view_all" not in perms:
            raise HTTPException(status_code=403, detail="Permiso denegado")
    return schemas.TicketDetail(
        id=t.id, ticket_number=t.ticket_number, title=t.title,
        description=t.description, severity=t.severity, status=t.status,
        category=t.category, assigned_to=t.assigned_to, reported_by=t.reported_by,
        chat_id=t.chat_id, created_at=t.created_at, updated_at=t.updated_at,
        due_at=t.due_at, resolved_at=t.resolved_at, resolution=t.resolution,
        metadata=t.metadata_ or {},
    )


@router.patch("/{ticket_id}", response_model=schemas.TicketOut)
def update_ticket(
    ticket_id: uuid.UUID,
    payload: schemas.TicketUpdate,
    user: models.User = Depends(require_permissions("ticket.manage")),
    db: Session = Depends(get_db),
):
    t = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    changes = {}
    if payload.status and payload.status != t.status:
        tickets_svc.transition(db, t, payload.status, user.id)
        changes["status"] = payload.status

    if payload.assigned_to is not None:
        t.assigned_to = payload.assigned_to
        changes["assigned_to"] = str(payload.assigned_to)
    if payload.resolution is not None:
        t.resolution = payload.resolution
        changes["resolution"] = "set"

    db.commit(); db.refresh(t)
    log_action(db, user_id=user.id, module="tickets", action="update",
               entity="ticket", entity_id=str(t.id), input_data=changes)
    return t


@router.post("/{ticket_id}/label")
def label_ticket(
    ticket_id: uuid.UUID,
    payload: schemas.LabelIn,
    user: models.User = Depends(require_permissions("ticket.manage")),
    db: Session = Depends(get_db),
):
    t = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    msg = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.chat_id == t.chat_id, models.ChatMessage.role == "user")
        .order_by(models.ChatMessage.created_at.asc()).first()
    )
    if not msg:
        raise HTTPException(status_code=404, detail="Sin mensaje asociado")

    pred = (t.metadata_ or {}).get("classifier", {})
    label = models.ClassifierLabel(
        message_id=msg.id,
        predicted_is_incident=pred.get("is_incident"),
        predicted_category=pred.get("category"),
        predicted_severity=pred.get("severity"),
        true_is_incident=payload.true_is_incident,
        true_category=payload.true_category,
        true_severity=payload.true_severity,
        labeled_by=user.id,
        notes=payload.notes,
    )
    db.add(label); db.commit()
    log_action(db, user_id=user.id, module="tickets", action="label",
               entity="ticket", entity_id=str(t.id))
    return {"ok": True}

