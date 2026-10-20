# backend/app/middleware/security.py
"""Headers de seguridad. NO inspecciona cuerpos JSON (evita falsos positivos)."""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


MAX_BODY = 32 * 1024  # 32 KB


class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        cl = request.headers.get("content-length")
        if cl:
            try:
                if int(cl) > MAX_BODY:
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
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; connect-src 'self' wss: https:; font-src 'self'"
        )
        return response