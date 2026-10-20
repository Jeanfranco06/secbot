from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app import models
from app.auth import require_permissions
from app.database import get_db

router = APIRouter(prefix="/api/v1/compliance", tags=["compliance"])

@router.get("/evidence")
def evidence(
    _: models.User = Depends(require_permissions("audit.view")),
    db: Session = Depends(get_db),
):
    return {
        "iso_27001_2022": {
            "audit_records": db.execute(text("SELECT COUNT(*) FROM audit_log")).scalar(),
            "active_policies": db.execute(text("SELECT COUNT(*) FROM kb_documents WHERE status='active' AND doc_type='policy'")).scalar(),
            "rbac_roles": db.execute(text("SELECT COUNT(*) FROM roles")).scalar(),
            "rbac_permissions": db.execute(text("SELECT COUNT(*) FROM permissions")).scalar(),
        },
        "nist_csf_2_0": {
            "incidents_managed": db.execute(text("SELECT COUNT(*) FROM tickets")).scalar(),
            "assets_tracked": db.execute(text("SELECT COUNT(*) FROM kb_documents")).scalar(),
            "users_managed": db.execute(text("SELECT COUNT(*) FROM users WHERE is_active")).scalar(),
        },
    }