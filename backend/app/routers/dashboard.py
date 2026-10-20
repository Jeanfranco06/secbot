from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from app import models
from app.auth import require_permissions
from app.services import metrics

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])

@router.get("/summary")
def summary(
    days: int = Query(30, ge=1, le=365),
    _: models.User = Depends(require_permissions("dashboard.view")),
):
    fin = datetime.utcnow()
    ini = fin - timedelta(days=days)
    return metrics.summary(ini, fin)