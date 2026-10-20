"""SSO OIDC con múltiples proveedores.
Soporta: azure, google, keycloak.
"""
import os
from authlib.integrations.starlette_client import OAuth
from fastapi import Request, HTTPException
from sqlalchemy.orm import Session
from app import models

PROVIDERS = {
    "azure": {
        "client_id": os.getenv("AZURE_CLIENT_ID"),
        "client_secret": os.getenv("AZURE_CLIENT_SECRET"),
        "server_metadata_url": (
            f"https://login.microsoftonline.com/{os.getenv('AZURE_TENANT_ID')}"
            "/v2.0/.well-known/openid-configuration"
        ),
        "client_kwargs": {"scope": "openid email profile"},
    },
    "google": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "server_metadata_url": "https://accounts.google.com/.well-known/openid-configuration",
        "client_kwargs": {"scope": "openid email profile"},
    },
    "keycloak": {
        "client_id": os.getenv("KEYCLOAK_CLIENT_ID"),
        "client_secret": os.getenv("KEYCLOAK_CLIENT_SECRET"),
        "server_metadata_url": (
            f"{os.getenv('KEYCLOAK_URL')}/realms/{os.getenv('KEYCLOAK_REALM')}"
            "/.well-known/openid-configuration"
        ),
        "client_kwargs": {"scope": "openid email profile"},
    },
}

oauth = OAuth()
_registered = False

def init_oauth():
    global _registered
    if _registered:
        return
    for name, cfg in PROVIDERS.items():
        if cfg["client_id"] and cfg["client_secret"]:
            oauth.register(name=name, **cfg)
    _registered = True

def provider_enabled(name: str) -> bool:
    cfg = PROVIDERS.get(name)
    return bool(cfg and cfg["client_id"] and cfg["client_secret"])

def upsert_identity(db: Session, provider: str, userinfo: dict) -> models.User:
    """Mapea userinfo a User local. Crea si no existe (JIT provisioning)."""
    email = userinfo.get("email") or userinfo.get("preferred_username")
    sub = userinfo.get("sub")
    if not email or not sub:
        raise HTTPException(status_code=400, detail="IdP no devolvió email o sub")

    ident = db.query(models.SsoIdentity).filter(
        models.SsoIdentity.provider == provider,
        models.SsoIdentity.subject == sub,
    ).first()

    if ident:
        user = db.query(models.User).filter(models.User.id == ident.user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=403, detail="Usuario inactivo")
        return user

    # Buscar por email
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            email=email,
            full_name=userinfo.get("name") or email,
            password_hash=None,
            is_active=True,
        )
        db.add(user); db.commit(); db.refresh(user)

        # Rol por defecto
        default_role = os.getenv("SSO_DEFAULT_ROLE", "employee")
        role = db.query(models.Role).filter(models.Role.name == default_role).first()
        if role:
            db.add(models.UserRole(user_id=user.id, role_id=role.id))
            db.commit()

    db.add(models.SsoIdentity(
        user_id=user.id, provider=provider, subject=sub,
        email=email, raw_claims=userinfo,
    ))
    db.commit()
    return user