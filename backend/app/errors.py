import logging
from typing import Any
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException

log = logging.getLogger(__name__)


class DomainError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, **extra: Any):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.extra = extra


class NotFoundError(DomainError):
    def __init__(self, entity: str, entity_id: Any):
        super().__init__(
            code="not_found",
            message=f"{entity} con id={entity_id} no existe",
            status_code=404,
            entity=entity,
            entity_id=str(entity_id),
        )


class ConflictError(DomainError):
    def __init__(self, message: str, **extra: Any):
        super().__init__(code="conflict", message=message, status_code=409, **extra)


class PermissionDeniedError(DomainError):
    def __init__(self, message: str = "No tienes permisos suficientes"):
        super().__init__(code="permission_denied", message=message, status_code=403)


class RateLimitExceededError(DomainError):
    def __init__(self, retry_after: int = 60):
        super().__init__(
            code="rate_limit_exceeded",
            message="Demasiadas peticiones. Intenta más tarde.",
            status_code=429,
            retry_after=retry_after,
        )


def install(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def _domain(request: Request, exc: DomainError):
        log.warning("domain_error", extra={
            "code": exc.code, "path": str(request.url.path), **exc.extra,
        })
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.code, "message": exc.message, **exc.extra},
        )

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=jsonable_encoder({"error": "validation_error", "details": exc.errors()}),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": "http_error", "message": str(exc.detail)},
        )

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception):
        log.exception("unhandled_error", extra={"path": str(request.url.path)})
        return JSONResponse(
            status_code=500,
            content={"error": "internal_error", "message": "Error interno"},
        )
