from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import (
    verify_password, create_access_token, create_refresh_token,
    get_current_user, get_user_roles, decode_token, oauth2_scheme,
    get_user_permissions,
)
from app.services.audit import log_action

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

from app.ratelimit import limit_login

@router.post("/login")
def login(payload: schemas.LoginIn, request: Request, db: Session = Depends(get_db)):
    limit_login(request)
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent", "")[:255]

    if not user or not verify_password(payload.password, user.password_hash):
        log_action(db, module="auth", action="login", result="fail",
                   ip=ip, user_agent=ua, input_data={"email": payload.email})
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    roles = get_user_roles(db, user.id)
    access = create_access_token(user, roles)
    refresh = create_refresh_token(user, roles)

    payload_refresh = decode_token(refresh)
    sess = models.Session(
        user_id=user.id,
        refresh_jti=payload_refresh["jti"],
        ip=ip,
        user_agent=ua,
    )
    db.add(sess)
    user.last_login_at = datetime.utcnow()
    db.commit()

    log_action(db, user_id=user.id, module="auth", action="login", result="ok",
               ip=ip, user_agent=ua)
    return schemas.TokenOut(access_token=access, refresh_token=refresh)

@router.post("/refresh", response_model=schemas.TokenOut)
def refresh(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if payload.get("kind") != "refresh":
        raise HTTPException(status_code=401, detail="Token no es refresh")

    jti = payload.get("jti")
    sess = db.query(models.Session).filter(models.Session.refresh_jti == jti).first()
    if not sess or sess.revoked_at is not None:
        raise HTTPException(status_code=401, detail="Sesión revocada")

    user = db.query(models.User).filter(models.User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no válido")

    roles = get_user_roles(db, user.id)
    new_refresh = create_refresh_token(user, roles)
    new_payload = decode_token(new_refresh)

    sess.revoked_at = datetime.utcnow()
    db.add(models.Session(
        user_id=user.id,
        refresh_jti=new_payload["jti"],
        ip=sess.ip,
        user_agent=sess.user_agent,
    ))
    db.commit()

    return schemas.TokenOut(
        access_token=create_access_token(user, roles),
        refresh_token=new_refresh,
    )

@router.post("/logout")
def logout(
    token: str = Depends(oauth2_scheme),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        payload = decode_token(token)
        jti = payload.get("jti")
        if jti:
            sess = db.query(models.Session).filter(models.Session.refresh_jti == jti).first()
            if sess:
                sess.revoked_at = datetime.utcnow()
                db.commit()
    except Exception:
        pass
    log_action(db, user_id=user.id, module="auth", action="logout")
    return {"ok": True}

@router.get("/me")
def me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "roles": get_user_roles(db, user.id),
        "permissions": sorted(get_user_permissions(db, user.id)),
    }