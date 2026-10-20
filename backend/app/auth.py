from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def hash_password(p: str) -> str:
    return pwd_context.hash(p)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

import uuid as _uuid

def create_token(sub: str, roles: list[str], ttl_min: int, kind: str = "access") -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=ttl_min)
    payload = {
        "sub": sub,
        "roles": roles,
        "kind": kind,
        "jti": str(_uuid.uuid4()),
        "exp": exp,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def create_access_token(user: models.User, roles: list[str]) -> str:
    return create_token(str(user.id), roles, settings.jwt_access_ttl_min, "access")

def create_refresh_token(user: models.User, roles: list[str]) -> str:
    return create_token(str(user.id), roles, settings.jwt_refresh_ttl_days * 24 * 60, "refresh")

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no válido")
    return user

def get_user_roles(db: Session, user_id) -> list[str]:
    rows = (
        db.query(models.Role.name)
        .join(models.UserRole, models.UserRole.role_id == models.Role.id)
        .filter(models.UserRole.user_id == user_id)
        .all()
    )
    return [r[0] for r in rows]

def require_roles(*allowed: str):
    def _checker(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
        roles = get_user_roles(db, user.id)
        if not any(r in allowed for r in roles):
            raise HTTPException(status_code=403, detail="Permiso denegado")
        return user
    return _checker

from functools import lru_cache
from sqlalchemy import text

@lru_cache(maxsize=512)
def _role_perms_cache(role_id: int) -> tuple[str, ...]:
    with SessionLocal() as db:
        rows = db.execute(text("""
            SELECT p.code FROM permissions p
            JOIN role_permissions rp ON rp.permission_id = p.id
            WHERE rp.role_id = :r
        """), {"r": role_id}).all()
    return tuple(r[0] for r in rows)

def get_user_permissions(db: Session, user_id) -> set[str]:
    role_ids = [
        r[0] for r in db.query(models.UserRole.role_id).filter(
            models.UserRole.user_id == user_id
        ).all()
    ]
    perms = set()
    for rid in role_ids:
        perms.update(_role_perms_cache(rid))
    return perms

def require_permissions(*codes: str):
    """Requiere TODOS los permisos indicados."""
    def _checker(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
        perms = get_user_permissions(db, user.id)
        missing = [c for c in codes if c not in perms]
        if missing:
            raise HTTPException(
                status_code=403,
                detail=f"Permisos faltantes: {', '.join(missing)}",
            )
        return user
    return _checker

def require_any_permission(*codes: str):
    """Requiere AL MENOS UNO de los permisos indicados."""
    def _checker(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
        perms = get_user_permissions(db, user.id)
        if not any(c in perms for c in codes):
            raise HTTPException(status_code=403, detail="Permiso denegado")
        return user
    return _checker

import os

JWT_KEYS = [os.getenv("JWT_SECRET")]
if os.getenv("JWT_SECRET_OLD"):
    JWT_KEYS.append(os.getenv("JWT_SECRET_OLD"))

def decode_token(token: str) -> dict:
    last_err = None
    for key in JWT_KEYS:
        try:
            return jwt.decode(token, key, algorithms=[settings.jwt_algorithm])
        except JWTError as e:
            last_err = e
    raise HTTPException(status_code=401, detail="Token inválido")