import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user
from app.config import settings
from app.services import rag, classifier, tickets, pii, prompt_guard, notification
from app.services.audit import log_action
from app.ratelimit import limit_chat
from app import observability

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


@router.post("/messages", response_model=schemas.ChatOut)
async def send_message(
    payload: schemas.ChatIn,
    request: Request,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit_chat(request, str(user.id), settings.ratelimit_chat_per_min)

    guard = prompt_guard.check(payload.message)
    if not guard.ok:
        log.warning("prompt_guard_block", extra={"reason": guard.reason, "user": str(user.id)})
        raise HTTPException(status_code=400, detail=f"Mensaje rechazado: {guard.reason}")

    msg = guard.sanitized

    # Chat
    if payload.chat_id:
        chat = db.query(models.ChatHistory).filter(
            models.ChatHistory.id == payload.chat_id,
            models.ChatHistory.user_id == user.id,
        ).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat no encontrado")
    else:
        chat = models.ChatHistory(user_id=user.id, title=msg[:60])
        db.add(chat); db.commit(); db.refresh(chat)

    user_msg = models.ChatMessage(chat_id=chat.id, role="user", content=pii.redact(msg))
    db.add(user_msg); db.commit()

    # RAG
    rag_result = rag.answer(msg)

    # Clasificación
    cls = classifier.classify(msg)
    is_incident = cls["is_incident"] and cls["confidence"] >= settings.incident_confidence_threshold

    ticket_id = None
    if is_incident:
        ticket = tickets.create_ticket(
            db,
            title=f"[{cls['category']}] {msg[:80]}",
            description=pii.redact(msg),
            category=cls["category"],
            severity=cls["severity"],
            reported_by=user.id,
            chat_id=chat.id,
            metadata={"confidence": cls["confidence"], "source": "chatbot",
                      "classifier": cls},
        )
        ticket_id = ticket.id
        observability.INCIDENTS.labels(cls["category"], cls["severity"]).inc()

        ok = notification.notify_incident(
            ticket_id=str(ticket.id),
            ticket_number=ticket.ticket_number,
            severity=ticket.severity,
            category=ticket.category or "otro",
            title=ticket.title,
            chat_id=str(chat.id),
            reported_by=str(user.id),
        )
        if ok:
            tickets.mark_notified(db, ticket.id)

    answer_text = rag_result["answer"]
    if is_incident:
        answer_text += (
            f"\n\nHe registrado el incidente como **{ticket.ticket_number}** "
            f"(severidad {ticket.severity}). El equipo de Seguridad te contactará."
        )

    assistant_msg = models.ChatMessage(
        chat_id=chat.id, role="assistant", content=answer_text,
        citations=rag_result["citations"],
        intent=cls["category"] if is_incident else "consulta",
        confidence=cls["confidence"],
        latency_ms=rag_result["latency_ms"],
        cached=rag_result.get("cached", False),
    )
    db.add(assistant_msg); db.commit(); db.refresh(assistant_msg)

    log_action(
        db, user_id=user.id, module="chat", action="message",
        entity="chat", entity_id=str(chat.id),
        ip=request.client.host if request.client else None,
        input_data={"len": len(msg), "is_incident": is_incident},
        output_data={"ticket_id": str(ticket_id) if ticket_id else None},
        request_id=getattr(request.state, "request_id", None),
    )

    return schemas.ChatOut(
        chat_id=chat.id,
        message_id=assistant_msg.id,
        answer=answer_text,
        citations=rag_result["citations"],
        intent=assistant_msg.intent,
        confidence=float(cls["confidence"]) if cls["confidence"] else None,
        latency_ms=rag_result["latency_ms"],
        cached=rag_result.get("cached", False),
        ticket_id=ticket_id,
    )


@router.get("/history")
def list_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(models.ChatHistory)
        .filter(models.ChatHistory.user_id == user.id)
        .order_by(models.ChatHistory.started_at.desc())
        .limit(50).all()
    )
    return [{"id": str(r.id), "title": r.title, "started_at": r.started_at.isoformat()} for r in rows]


@router.get("/history/{chat_id}")
def get_chat(
    chat_id: uuid.UUID,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = db.query(models.ChatHistory).filter(models.ChatHistory.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat no encontrado")
    if chat.user_id != user.id:
        from app.auth import get_user_permissions
        perms = get_user_permissions(db, user.id)
        if "chat.view_all" not in perms:
            raise HTTPException(status_code=403, detail="Permiso denegado")
    msgs = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.chat_id == chat_id)
        .order_by(models.ChatMessage.created_at.asc())
        .all()
    )
    return {
        "chat_id": str(chat.id),
        "messages": [
            {"role": m.role, "content": m.content, "citations": m.citations,
             "created_at": m.created_at.isoformat()}
            for m in msgs
        ],
    }