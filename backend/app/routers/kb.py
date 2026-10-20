import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from app import models
from app.database import get_db
from app.auth import require_permissions
from app.services.audit import log_action
from app.ingestion.ingest import ingest_one, ingest_dir, ingest_bytes
from pathlib import Path
import shutil
import tempfile

from app.services import cache

# tras ingest_one exitoso
cache.invalidate_all()

router = APIRouter(prefix="/api/v1/kb", tags=["kb"])

@router.get("/documents")
def list_docs(
    status: str | None = None,
    _: models.User = Depends(require_permissions("kb.manage")),
    db: Session = Depends(get_db),
):
    q = db.query(models.KbDocument)
    if status:
        q = q.filter(models.KbDocument.status == status)
    docs = q.order_by(models.KbDocument.updated_at.desc()).all()
    return [
        {"id": str(d.id), "title": d.title, "doc_type": d.doc_type,
         "version": d.version, "status": d.status, "owner": d.owner,
         "updated_at": d.updated_at.isoformat()}
        for d in docs
    ]

@router.post("/documents/upload")
async def upload_doc(
    file: UploadFile = File(...),
    title: str = Form(...),
    doc_type: str = Form("other"),
    version: str = Form("1.0"),
    owner: str | None = Form(None),
    section_split: bool = Form(False),
    user: models.User = Depends(require_permissions("kb.manage")),
    db: Session = Depends(get_db),
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    try:
        result = ingest_one(tmp_path, title, doc_type, version, owner, section_split, original_name=file.filename)
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    log_action(db, user_id=user.id, module="kb", action="upload",
               entity="document", entity_id=result.get("doc_id"),
               input_data={"title": title, "version": version})
    return result

@router.post("/documents/{doc_id}/obsolete")
def obsolete_doc(
    doc_id: uuid.UUID,
    user: models.User = Depends(require_permissions("kb.manage")),
    db: Session = Depends(get_db),
):
    doc = db.query(models.KbDocument).filter(models.KbDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    doc.status = "obsolete"
    db.commit()
    log_action(db, user_id=user.id, module="kb", action="obsolete",
               entity="document", entity_id=str(doc_id))
    return {"ok": True}

@router.get("/stats")
def stats(
    _: models.User = Depends(require_permissions("kb.manage")),
    db: Session = Depends(get_db),
):
    row = db.execute(text("""
        SELECT
          COUNT(*) FILTER (WHERE status='active') AS active,
          COUNT(*) FILTER (WHERE status='obsolete') AS obsolete,
          COUNT(*) FILTER (WHERE status='draft') AS draft
        FROM kb_documents
    """)).mappings().first()
    chunks = db.execute(text("SELECT COUNT(*) FROM kb_chunks")).scalar()
    return {"documents": dict(row), "chunks": chunks}