"""Métricas Prometheus + tracing OTLP."""
import os
import time
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import APIRouter, Response
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

REQUESTS = Counter(
    "secbot_requests_total", "Total de requests",
    ["method", "endpoint", "status"],
)
LATENCY = Histogram(
    "secbot_request_latency_seconds", "Latencia por endpoint",
    ["method", "endpoint"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
)
CHAT_LATENCY = Histogram(
    "secbot_chat_latency_seconds", "Latencia del chat",
    buckets=[0.5, 1, 2, 3, 5, 8, 12],
)
INCIDENTS = Counter(
    "secbot_incidents_total", "Incidentes clasificados",
    ["category", "severity"],
)
CACHE_HITS = Counter("secbot_cache_hits_total", "Cache hits")
CACHE_MISSES = Counter("secbot_cache_misses_total", "Cache misses")
ACTIVE_WS = Gauge("secbot_active_websockets", "WebSockets activos")

def setup_tracing(app):
    otlp = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if not otlp:
        return
    resource = Resource.create({"service.name": "secbot-api"})
    provider = TracerProvider(resource=resource)
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=otlp)))
    trace.set_tracer_provider(provider)
    FastAPIInstrumentor.instrument_app(app)

metrics_router = APIRouter()

@metrics_router.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

def track_request(method: str, endpoint: str, status: int, seconds: float):
    REQUESTS.labels(method, endpoint, str(status)).inc()
    LATENCY.labels(method, endpoint).observe(seconds)