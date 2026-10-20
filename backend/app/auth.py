"""Autenticación: JWT RS256 (preferido) o HS256 (fallback de arranque).
Soporta rotación de claves y revocación vía tabla sessions.
"""
import logging
import uuid as _uuid
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import text

from app import models
from app.config import settings
from app.database import SessionLocal

log = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ---------- Password ----------

def hash_password(p: str) -> str:
    if not p or len(p) < 8:
        raise ValueError("Password demasiado corto")
    return pwd_context.hash(p)


def verify_password(plain: str, hashed: str | None) -> bool:
    if not hashed:
        return False
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


# ---------- Claves JWT ----------

@lru_cache(maxsize=1)
def _private_key() -> str:
    if settings.jwt_algorithm.startswith("RS"):
        path = Path(settings.jwt_private_key_path)
        if not path.exists():
            raise RuntimeError(f"Falta clave privada JWT en {path}")
        return path.read_text()
    # HS256 fallback
    import os
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET requerido para HS256")
    return secret


@lru_cache(maxsize=1)
def _public_key() -> str:
    if settings.jwt_algorithm.startswith("RS"):
        path = Path(settings.jwt_public_key_path)
        if not path.exists():
            raise RuntimeError(f"Falta clave pública JWT en {path}")
        return path.read_text()
    import os
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET requerido para HS256")
    return secret


def _extra_public_keys() -> list[str]:
    """Claves antiguas para rotación."""
    keys = []
    old = Path(settings.jwt_public_key_path.replace(".pem", "_old.pem"))
    if old.exists():
        content = old.read_text().strip()
        if content:
            keys.append(content)
    return keys


# ---------- Tokens ----------

def create_token(sub: str, roles: list[str], ttl_min: int, kind: str = "access") -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "roles": roles,
        "kind": kind,
        "jti": str(_uuid.uuid4()),
        "iss": settings.jwt_issuer,
        "iat": int(now.timestamp()),
        "exp": now + timedelta(minutes=ttl_min),
    }
    headers = {"kid": settings.jwt_kid} if settings.jwt_algorithm.startswith("RS") else {}
    return jwt.encode(payload, _private_key(), algorithm=settings.jwt_algorithm, headers=headers)


def create_access_token(user: models.User, roles: list[str]) -> str:
    return create_token(str(user.id), roles, settings.jwt_access_ttl_min, "access")


def create_refresh_token(user: models.User, roles: list[str]) -> str:
    return create_token(str(user.id), roles, settings.jwt_refresh_ttl_days * 24 * 60, "refresh")


def decode_token(token: str) -> dict:
    keys = [_public_key()] + _extra_public_keys()
    last_err: Exception | None = None
    for k in keys:
        try:
            return jwt.decode(
                token, k, algorithms=[settings.jwt_algorithm],
                issuer=settings.jwt_issuer,
                options={"verify_aud": False},
            )
        except JWTError as e:
            last_err = e
    log.info("jwt_decode_failed", extra={"err": str(last_err)})
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")


def decode_refresh(token: str) -> dict:
    payload = decode_token(token)
    if payload.get("kind") != "refresh":
        raise HTTPException(status_code=401, detail="Token no es refresh")
    return payload


# ---------- Roles y permisos ----------

@lru_cache(maxsize=512)
def _role_perms_cache(role_id: int) -> tuple[str, ...]:
    with SessionLocal() as db:
        rows = db.execute(text("""
            SELECT p.code FROM permissions p
            JOIN role_permissions rp ON rp.permission_id = p.id
            WHERE rp.role_id = :r
        """), {"r": role_id}).all()
    return tuple(r[0] for r in rows)


def get_user_roles(db: Session, user_id) -> list[str]:
    rows = (
        db.query(models.Role.name)
        .join(models.UserRole, models.UserRole.role_id == models.Role.id)
        .filter(models.UserRole.user_id == user_id)
        .all()
    )
    return [r[0] for r in rows]


def get_user_permissions(db: Session, user_id) -> set[str]:
    role_ids = [
        r[0] for r in db.query(models.UserRole.role_id).filter(
            models.UserRole.user_id == user_id
        ).all()
    ]
    perms: set[str] = set()
    for rid in role_ids:
        perms.update(_role_perms_cache(rid))
    return perms


def invalidate_permissions_cache() -> None:
    _role_perms_cache.cache_clear()


# ---------- Dependencias ----------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(lambda: next(_db_iter())),
) -> models.User:
    payload = decode_token(token)
    if payload.get("kind") != "access":
        raise HTTPException(status_code=401, detail="Token no es access")
    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no válido o inactivo")
    return user


def _db_iter():
    from app.database import get_db as _g
    yield from _g()


def require_permissions(*codes: str):
    def _checker(
        user: models.User = Depends(get_current_user),
        db: Session = Depends(_db_iter),
    ):
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
    def _checker(
        user: models.User = Depends(get_current_user),
        db: Session = Depends(_db_iter),
    ):
        perms = get_user_permissions(db, user.id)
        if not any(c in perms for c in codes):
            raise HTTPException(status_code=403, detail="Permiso denegado")
        return user
    return _checker


def require_roles(*allowed: str):
    def _checker(
        user: models.User = Depends(get_current_user),
        db: Session = Depends(_db_iter),
    ):
        roles = get_user_roles(db, user.id)
        if not any(r in allowed for r in roles):
            raise HTTPException(status_code=403, detail="Rol no autorizado")
        return user
    return _checker