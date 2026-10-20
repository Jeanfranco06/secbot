"""Dependencias FastAPI comunes."""
from typing import Annotated
from fastapi import Depends, Header, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.auth import get_current_user, require_permissions, require_any_permission


DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[models.User, Depends(get_current_user)]


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "")


RequestId = Annotated[str, Depends(get_request_id)]


def get_client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


ClientIp = Annotated[str, Depends(get_client_ip)]


def get_user_agent(request: Request) -> str:
    return request.headers.get("user-agent", "")[:255]


UserAgent = Annotated[str, Depends(get_user_agent)]


def require(*codes: str):
    return Depends(require_permissions(*codes))


def require_any(*codes: str):
    return Depends(require_any_permission(*codes))