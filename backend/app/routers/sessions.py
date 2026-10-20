from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user
from app.services.audit import log_action

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


@router.get("", response_model=list[schemas.SessionOut])
def list_my_sessions(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(models.Session)
        .filter(models.Session.user_id == user.id, models.Session.revoked_at.is_(None))
        .order_by(models.Session.created_at.desc()).limit(50).all()
    )
    return [
        schemas.SessionOut(
            id=r.id, ip=str(r.ip) if r.ip else None,
            user_agent=r.user_agent, created_at=r.created_at,
            revoked_at=r.revoked_at, current=False,
        )
        for r in rows
    ]


@router.delete("/{session_id}")
def revoke_session(
    session_id: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    import uuid as _u
    try:
        sid = _u.UUID(session_id)
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="ID inválido")

    s = db.query(models.Session).filter(
        models.Session.id == sid, models.Session.user_id == user.id,
    ).first()
    if not s:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    s.revoked_at = datetime.utcnow()
    s.revoked_reason = "user_revoke"
    db.commit()
    log_action(db, user_id=user.id, module="sessions", action="revoke",
               entity="session", entity_id=str(s.id))
    return {"ok": True}