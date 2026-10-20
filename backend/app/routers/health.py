from fastapi import APIRouter
from app.services import health

router = APIRouter(tags=["health"])


@router.get("/health")
def health_basic():
    return {"status": "ok"}


@router.get("/health/deep")
def health_deep():
    return health.deep()