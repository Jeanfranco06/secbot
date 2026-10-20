import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from app.routers import auth, chat, tickets, admin

from app.routers import chat_ws
app.include_router(chat_ws.router)

from app.middleware.security import SecurityMiddleware
app.add_middleware(SecurityMiddleware)

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(title="SecBot API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(tickets.router)
app.include_router(admin.router)

@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request.state.request_id = str(uuid.uuid4())
    return await call_next(request)

@app.get("/health")
def health():
    return {"status": "ok"}

from fastapi import Request
import time
from app import observability

app.include_router(observability.metrics_router)
observability.setup_tracing(app)

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    t0 = time.time()
    response = await call_next(request)
    endpoint = request.url.path
    if endpoint.startswith("/api/v1/chat/messages"):
        observability.CHAT_LATENCY.observe(time.time() - t0)
    observability.track_request(request.method, endpoint, response.status_code, time.time() - t0)
    return response