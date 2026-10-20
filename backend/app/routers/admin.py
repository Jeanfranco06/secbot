import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app import models, schemas
from app.database import get_db
from app.auth import (
    require_roles, require_permissions, hash_password,
    get_user_roles, get_user_permissions,
)
from app.services.audit import log_action
from app.auth import invalidate_permissions_cache

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# ---------- Users ----------

@router.get("/users", response_model=list[schemas.UserOut])
def list_users(
    q: str | None = None,
    active: bool | None = None,
    _: models.User = Depends(require_permissions("users.manage")),
    db: Session = Depends(get_db),
):
    query = db.query(models.User)
    if q:
        query = query.filter(models.User.email.ilike(f"%{q}%") | models.User.full_name.ilike(f"%{q}%"))
    if active is not None:
        query = query.filter(models.User.is_active == active)
    users = query.order_by(models.User.created_at.desc()).all()
    return [
        schemas.UserOut(
            id=u.id, email=u.email, full_name=u.full_name,
            is_active=u.is_active, roles=get_user_roles(db, u.id),
        )
        for u in users
    ]

@router.post("/users", response_model=schemas.UserOut)
def create_user(
    payload: schemas.UserCreate,
    admin: models.User = Depends(require_permissions("users.manage")),
    db: Session = Depends(get_db),
):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email ya registrado")
    user = models.User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    for role_name in payload.roles:
        role = db.query(models.Role).filter(models.Role.name == role_name).first()
        if role:
            db.add(models.UserRole(user_id=user.id, role_id=role.id, granted_by=admin.id))
    db.commit()
    log_action(db, user_id=admin.id, module="admin", action="user_create",
               entity="user", entity_id=str(user.id))
    return schemas.UserOut(
        id=user.id, email=user.email, full_name=user.full_name,
        is_active=user.is_active, roles=payload.roles,
    )

@router.patch("/users/{user_id}")
def update_user(
    user_id: uuid.UUID,
    payload: schemas.UserUpdate,
    admin: models.User = Depends(require_permissions("users.manage")),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    changes = {}
    if payload.full_name is not None:
        user.full_name = payload.full_name
        changes["full_name"] = payload.full_name
    if payload.is_active is not None:
        user.is_active = payload.is_active
        changes["is_active"] = payload.is_active
    if payload.password:
        user.password_hash = hash_password(payload.password)
        changes["password"] = "***"
    if payload.roles is not None:
        db.query(models.UserRole).filter(models.UserRole.user_id == user.id).delete()
        for role_name in payload.roles:
            role = db.query(models.Role).filter(models.Role.name == role_name).first()
            if role:
                db.add(models.UserRole(user_id=user.id, role_id=role.id, granted_by=admin.id))
        changes["roles"] = payload.roles

    db.commit()
    log_action(db, user_id=admin.id, module="admin", action="user_update",
               entity="user", entity_id=str(user.id), input_data=changes)
    return {"ok": True, "changes": changes}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: uuid.UUID,
    admin: models.User = Depends(require_permissions("users.manage")),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")
    user.is_active = False
    db.commit()
    log_action(db, user_id=admin.id, module="admin", action="user_deactivate",
               entity="user", entity_id=str(user.id))
    return {"ok": True}

@router.post("/users/{user_id}/reset-password")
def reset_password(
    user_id: uuid.UUID,
    payload: schemas.PasswordReset,
    admin: models.User = Depends(require_permissions("users.manage")),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.password_hash = hash_password(payload.new_password)
    # revocar sesiones activas
    db.query(models.Session).filter(
        models.Session.user_id == user.id,
        models.Session.revoked_at.is_(None),
    ).update({"revoked_at": models.Session.created_at})
    db.commit()
    log_action(db, user_id=admin.id, module="admin", action="password_reset",
               entity="user", entity_id=str(user.id))
    return {"ok": True}

# ---------- Roles y permisos ----------

@router.get("/roles")
def list_roles(
    _: models.User = Depends(require_permissions("users.manage")),
    db: Session = Depends(get_db),
):
    rows = db.execute(text("""
        SELECT r.id, r.name, r.description,
               array_agg(p.code) FILTER (WHERE p.code IS NOT NULL) AS perms
        FROM roles r
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        LEFT JOIN permissions p ON p.id = rp.permission_id
        GROUP BY r.id, r.name, r.description
        ORDER BY r.id
    """)).mappings().all()
    return [
        {"id": r["id"], "name": r["name"], "description": r["description"],
         "permissions": r["perms"] or []}
        for r in rows
    ]

@router.get("/permissions")
def list_permissions(
    _: models.User = Depends(require_permissions("users.manage")),
    db: Session = Depends(get_db),
):
    rows = db.query(models.Permission).order_by(models.Permission.code).all()
    return [{"code": r.code, "description": r.description} for r in rows]

@router.put("/roles/{role_id}/permissions")
def set_role_permissions(
    role_id: int,
    payload: schemas.RolePermissionsIn,
    admin: models.User = Depends(require_permissions("users.manage")),
    db: Session = Depends(get_db),
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    db.execute(text("DELETE FROM role_permissions WHERE role_id = :r"), {"r": role_id})
    for code in payload.permissions:
        pid = db.execute(text("SELECT id FROM permissions WHERE code=:c"), {"c": code}).scalar()
        if pid:
            db.execute(text(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES (:r, :p)"
            ), {"r": role_id, "p": pid})
    db.commit()
    log_action(db, user_id=admin.id, module="admin", action="role_permissions_update",
               entity="role", entity_id=str(role_id),
               input_data={"permissions": payload.permissions})
    return {"ok": True}

# ---------- Auditoría ----------

@router.get("/audit")
def list_audit(
    module: str | None = None,
    action: str | None = None,
    user_id: uuid.UUID | None = None,
    from_ts: str | None = None,
    to_ts: str | None = None,
    limit: int = Query(100, le=1000),
    offset: int = 0,
    _: models.User = Depends(require_permissions("audit.view")),
    db: Session = Depends(get_db),
):
    q = db.query(models.AuditLog)
    if module:
        q = q.filter(models.AuditLog.module == module)
    if action:
        q = q.filter(models.AuditLog.action == action)
    if user_id:
        q = q.filter(models.AuditLog.user_id == user_id)
    if from_ts:
        q = q.filter(models.AuditLog.created_at >= from_ts)
    if to_ts:
        q = q.filter(models.AuditLog.created_at <= to_ts)

    total = q.count()
    rows = q.order_by(models.AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "id": r.id,
                "user_id": str(r.user_id) if r.user_id else None,
                "module": r.module, "action": r.action,
                "entity": r.entity, "entity_id": r.entity_id,
                "result": r.result, "ip": str(r.ip) if r.ip else None,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ],
    }

@router.post("/users/{user_id}/erase")
def erase_user_data(
    user_id: uuid.UUID,
    admin: models.User = Depends(require_permissions("users.manage")),
    db: Session = Depends(get_db),
):
    """Anonimiza conversaciones y tickets de un usuario (derecho al olvido)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # No se puede borrar audit_log (append-only); se anonimiza referencia
    db.execute(text("""
        UPDATE chat_messages SET content = '[REDACTADO POR DERECHO AL OLVIDO]'
        WHERE chat_id IN (SELECT id FROM chat_history WHERE user_id = :u)
    """), {"u": user_id})
    db.execute(text("""
        UPDATE tickets SET description = '[REDACTADO]', resolution = NULL
        WHERE reported_by = :u
    """), {"u": user_id})
    user.email = f"erased+{user.id}@anon.local"
    user.full_name = "[Anonimizado]"
    user.is_active = False
    db.commit()
    invalidate_permissions_cache()

    log_action(db, user_id=admin.id, module="admin", action="user_erase",
               entity="user", entity_id=str(user_id))
    return {"ok": True}

@router.post("/retention/run")
def run_retention(
    _: models.User = Depends(require_permissions("users.manage")),
):
    from scripts.retention import run
    result = run()
    return {"ok": True, "deleted": result}