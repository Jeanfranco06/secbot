import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import Response, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app import models
from app.database import get_db
from app.auth import require_permissions
from app.services.audit import log_action
from app.ingestion.ingest import ingest_one, ingest_dir, ingest_bytes
from app.services import kb_versioning, cache, notification

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

@router.get("/documents/{doc_id}")
def get_doc_detail(
    doc_id: uuid.UUID,
    _: models.User = Depends(require_permissions("kb.manage")),
    db: Session = Depends(get_db),
):
    doc = db.query(models.KbDocument).filter(models.KbDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    chunks_rows = (
        db.query(models.KbChunk)
        .filter(models.KbChunk.document_id == doc_id)
        .order_by(models.KbChunk.chunk_index.asc())
        .all()
    )

    # Buscar archivo original en disco si existe
    source_content = None
    if doc.source_uri:
        candidate_paths = [
            Path(doc.source_uri),
            Path("/app/kb_templates") / Path(doc.source_uri).name,
            Path("kb_templates") / Path(doc.source_uri).name,
        ]
        for base_dir in [Path("/app/kb_templates"), Path("kb_templates")]:
            if base_dir.is_dir():
                found = list(base_dir.rglob(Path(doc.source_uri).name))
                if found:
                    candidate_paths.append(found[0])

        for p in candidate_paths:
            if p.is_file():
                try:
                    source_content = p.read_text(encoding="utf-8")
                    break
                except Exception:
                    pass

    if source_content is None:
        source_content = "\n\n".join(c.content for c in chunks_rows) if chunks_rows else ""

    total_tokens = sum(c.token_count or 0 for c in chunks_rows)

    return {
        "id": str(doc.id),
        "title": doc.title,
        "source_uri": doc.source_uri,
        "doc_type": doc.doc_type,
        "version": doc.version,
        "owner": doc.owner,
        "status": doc.status,
        "classification": doc.classification,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
        "total_chunks": len(chunks_rows),
        "total_tokens": total_tokens,
        "content": source_content,
        "chunks": [
            {
                "chunk_index": c.chunk_index,
                "section": c.section,
                "token_count": c.token_count,
                "content": c.content,
            }
            for c in chunks_rows
        ],
    }

@router.get("/documents/{doc_id}/download")
def download_doc(
    doc_id: uuid.UUID,
    format: str | None = None,
    user: models.User = Depends(require_permissions("kb.manage")),
    db: Session = Depends(get_db),
):
    doc = db.query(models.KbDocument).filter(models.KbDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    log_action(
        db,
        user_id=user.id,
        module="kb",
        action="download",
        entity="document",
        entity_id=str(doc_id),
        input_data={"doc_id": str(doc_id), "title": doc.title, "format": format},
        output_data={"ok": True},
    )

    chunks_rows = (
        db.query(models.KbChunk)
        .filter(models.KbChunk.document_id == doc_id)
        .order_by(models.KbChunk.chunk_index.asc())
        .all()
    )
    content = "\n\n".join(c.content for c in chunks_rows)
    safe_name = "".join(c for c in doc.title if c.isalnum() or c in (" ", "_", "-")).rstrip().replace(" ", "_")
    base_name = safe_name or "documento"

    # Exportar a PDF usando ReportLab
    if format == "pdf":
        import io
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        buffer = io.BytesIO()
        doc_pdf = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#1E3A8A'),
            spaceAfter=14
        )
        body_style = ParagraphStyle(
            'DocBody',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#1F2937'),
            spaceAfter=8
        )
        meta_style = ParagraphStyle(
            'DocMeta',
            parent=styles['Italic'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#6B7280'),
            spaceAfter=15
        )

        elements = [
            Paragraph(f"SecBot Knowledge Base: {doc.title}", title_style),
            Paragraph(f"Tipo: {doc.doc_type.upper()} | Versión: {doc.version} | Estado: {doc.status.upper()} | Generado: {doc.updated_at.strftime('%Y-%m-%d')}", meta_style),
            Spacer(1, 10)
        ]

        for p in content.split("\n\n"):
            p_clean = p.strip().replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            if p_clean:
                if p_clean.startswith("#"):
                    elements.append(Paragraph(f"<b>{p_clean.lstrip('#').strip()}</b>", styles['Heading2']))
                else:
                    elements.append(Paragraph(p_clean, body_style))
                elements.append(Spacer(1, 4))

        doc_pdf.build(elements)
        buffer.seek(0)
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{base_name}.pdf"'}
        )

    # Exportar a Word (.docx) usando python-docx
    if format == "docx" or format == "word":
        import io
        import docx
        doc_word = docx.Document()
        doc_word.add_heading(doc.title, level=0)
        doc_word.add_paragraph(f"Tipo: {doc.doc_type} | Versión: {doc.version} | Estado: {doc.status} | Fecha: {doc.updated_at.strftime('%Y-%m-%d')}")
        
        for p in content.split("\n\n"):
            p_clean = p.strip()
            if p_clean:
                if p_clean.startswith("#"):
                    doc_word.add_heading(p_clean.lstrip("#").strip(), level=2)
                else:
                    doc_word.add_paragraph(p_clean)

        buffer = io.BytesIO()
        doc_word.save(buffer)
        buffer.seek(0)
        return Response(
            content=buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{base_name}.docx"'}
        )

    # Descarga por defecto en Markdown (.md)
    filename = f"{base_name}.md"
    return Response(
        content=content.encode("utf-8"),
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

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
    data = await file.read()
    try:
        result = ingest_bytes(data, file.filename, title, doc_type, version, owner, section_split)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_action(db, user_id=user.id, module="kb", action="upload",
               entity="document", entity_id=result.get("doc_id"),
               input_data={"title": title, "version": version}, output_data={"chunks": result.get("chunks", 0), "doc_id": result.get("doc_id")})
    cache.invalidate_all()
    try:
        notification.notify_kb_updated(
            user=user.email, title=title, version=version,
            chunks=result.get("chunks", 0), action="upload",
        )
    except Exception:
        pass
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
               entity="document", entity_id=str(doc_id), input_data={"doc_id": str(doc_id)}, output_data={"ok": True, "status": "obsolete"})
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
