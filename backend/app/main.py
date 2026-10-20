"""Punto de entrada FastAPI consolidado."""
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app import __version__, errors, observability
from app.config import settings
from app.logging_config import setup_logging
from app.middleware.security import SecurityMiddleware
from app.routers import (
    auth, chat, chat_ws, tickets, admin, dashboard, reports,
    feedback, kb, compliance, health, sessions,
)
from app.routers import sso as sso_router
from app.routers import jwks as jwks_router

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.log_level, json_output=settings.is_production)
    log.info("secbot_starting", extra={"version": __version__, "env": settings.env})

    # Warn si SSO o SIEM mal configurados
    if settings.sso_enabled:
        from app.services import sso as sso_svc
        sso_svc.init_oauth()
    if settings.siem_enabled and not settings.siem_endpoint:
        log.warning("siem_enabled_sin_endpoint")

    yield
    log.info("secbot_stopping")


app = FastAPI(
    title="SecBot API",
    version=__version__,
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
)

# Middlewares (orden importa: security primero)
app.add_middleware(SecurityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = rid
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    return response


# Error handlers
errors.install(app)

# Observabilidad
if settings.metrics_enabled:
    app.include_router(observability.metrics_router)
observability.setup_tracing(app)


# Routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(chat_ws.router)
app.include_router(tickets.router)
app.include_router(admin.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(feedback.router)
app.include_router(kb.router)
app.include_router(compliance.router)
app.include_router(health.router)
app.include_router(sessions.router)
app.include_router(sso_router.router)
app.include_router(jwks_router.router)
