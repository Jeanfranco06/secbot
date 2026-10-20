"""Headers de seguridad, sanitización y bloqueo de inputs."""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import re

SQLI = re.compile(r"(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b.*\b(FROM|WHERE|INTO)\b)", re.IGNORECASE)
XSS = re.compile(r"(<script|javascript:|onerror\s*=|onload\s*=)", re.IGNORECASE)

MAX_BODY = 32 * 1024  # 32 KB

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Tamaño máximo
        cl = request.headers.get("content-length")
        if cl and int(cl) > MAX_BODY:
            raise HTTPException(status_code=413, detail="Payload demasiado grande")

        # Sanitización básica en query params
        for v in request.query_params.values():
            if SQLI.search(v) or XSS.search(v):
                raise HTTPException(status_code=400, detail="Input sospechoso")

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