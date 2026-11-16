# backend/app/middleware/security.py
"""Headers de seguridad. NO inspecciona cuerpos JSON (evita falsos positivos)."""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


MAX_BODY = 32 * 1024  # 32 KB para JSON estándar
MAX_UPLOAD_BODY = 20 * 1024 * 1024  # 20 MB para subida de documentos KB


class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        cl = request.headers.get("content-length")
        if cl:
            try:
                limit = MAX_UPLOAD_BODY if path.startswith("/api/v1/kb/") else MAX_BODY
                if int(cl) > limit:
                    from fastapi.responses import JSONResponse
                    return JSONResponse(status_code=413, content={"error": "payload_too_large"})
            except ValueError:
                pass

        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        if path.startswith(("/docs", "/redoc", "/openapi.json")):
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https://fastapi.tiangolo.com; "
                "connect-src 'self' wss: https:; "
                "font-src 'self' https://cdn.jsdelivr.net data:"
            )
        else:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data:; connect-src 'self' wss: https:; font-src 'self'"
            )
        return response
