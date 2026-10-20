from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user
from app.services.audit import log_action

router = APIRouter(prefix="/api/v1/chat/feedback", tags=["feedback"])

@router.post("")
def submit_feedback(
    payload: schemas.FeedbackIn,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=422, detail="rating 1-5")

    msg = db.query(models.ChatMessage).filter(models.ChatMessage.id == payload.message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")

    fb = models.ChatFeedback(
        message_id=payload.message_id,
        user_id=user.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(fb)
    db.commit()
    log_action(db, user_id=user.id, module="chat", action="feedback",
               entity="message", entity_id=str(payload.message_id),
               input_data={"rating": payload.rating})
    return {"ok": True}