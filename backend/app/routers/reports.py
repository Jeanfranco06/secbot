import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from app import models
from app.auth import require_permissions
from app.database import get_db
from sqlalchemy.orm import Session
from app.services import metrics, reports
from app.services.audit import log_action

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])

@router.get("/operational")
def operational(
    days: int = Query(30, ge=1, le=365),
    _: models.User = Depends(require_permissions("report.export")),
):
    fin = datetime.utcnow()
    ini = fin - timedelta(days=days)
    return metrics.summary(ini, fin)

@router.get("/management")
def management(
    months: int = Query(6, ge=1, le=24),
    _: models.User = Depends(require_permissions("report.export")),
):
    fin = datetime.utcnow()
    ini = fin - timedelta(days=30 * months)
    return metrics.summary(ini, fin)

@router.get("/export")
def export_report(
    report: str = Query("operational", pattern="^(operational|management)$"),
    format: str = Query("pdf", pattern="^(pdf|docx|xlsx)$"),
    days: int = Query(30, ge=1, le=365),
    user: models.User = Depends(require_permissions("report.export")),
    db: Session = Depends(get_db),
):
    fin = datetime.utcnow()
    ini = fin - timedelta(days=days)
    s = metrics.summary(ini, fin)

    exporter = reports.EXPORTERS.get(format)
    if not exporter:
        raise HTTPException(status_code=400, detail="Formato no soportado")

    path = exporter(report, s)
    size = os.path.getsize(path)

    exp = models.ReportExport(
        user_id=user.id, report_type=report, format=format,
        params={"days": days}, file_path=str(path), size_bytes=size,
    )
    db.add(exp)
    db.commit()

    log_action(db, user_id=user.id, module="reports", action="export",
               entity="report", entity_id=str(exp.id),
               input_data={"report": report, "format": format, "days": days})

    media = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }[format]

    return FileResponse(path, media_type=media, filename=os.path.basename(path))

@router.get("/exports")
def list_exports(
    user: models.User = Depends(require_permissions("report.export")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(models.ReportExport)
        .filter(models.ReportExport.user_id == user.id)
        .order_by(models.ReportExport.created_at.desc())
        .limit(50).all()
    )
    return [
        {"id": str(r.id), "report_type": r.report_type, "format": r.format,
         "size_bytes": r.size_bytes, "created_at": r.created_at.isoformat()}
        for r in rows
    ]