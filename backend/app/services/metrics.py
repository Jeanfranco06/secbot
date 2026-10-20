"""Métricas de dashboard. Consultas parametrizadas y cacheadas 60s."""
import logging
from datetime import datetime, timedelta

from sqlalchemy import text

from app.database import SessionLocal
from app.services import cache

log = logging.getLogger(__name__)

MINUTES_SAVED_PER_QUERY = 10


def _summary_uncached(ini: datetime, fin: datetime) -> dict:
    params = {"ini": ini, "fin": fin}
    with SessionLocal() as db:
        total_queries = db.execute(text("""
            SELECT COUNT(*) FROM chat_messages
            WHERE role='user' AND created_at BETWEEN :ini AND :fin
        """), params).scalar() or 0

        incidents = db.execute(text("""
            SELECT COUNT(*) FROM tickets
            WHERE source='chatbot' AND created_at BETWEEN :ini AND :fin
        """), params).scalar() or 0

        resolved_without = db.execute(text("""
            SELECT COUNT(DISTINCT ch.id)
            FROM chat_history ch
            WHERE ch.started_at BETWEEN :ini AND :fin
              AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.chat_id = ch.id)
        """), params).scalar() or 0

        latency = db.execute(text("""
            SELECT
              COALESCE(AVG(latency_ms), 0) AS avg_ms,
              COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) AS p95_ms
            FROM chat_messages
            WHERE role='assistant' AND created_at BETWEEN :ini AND :fin
        """), params).mappings().first()

        citation = db.execute(text("""
            SELECT
              COUNT(*) FILTER (WHERE citations IS NOT NULL AND citations::text <> '[]') AS con,
              COUNT(*) AS total
            FROM chat_messages
            WHERE role='assistant' AND created_at BETWEEN :ini AND :fin
        """), params).mappings().first()

        top_topics = db.execute(text("""
            SELECT COALESCE(intent, 'sin_clasificar') AS topic, COUNT(*) AS n
            FROM chat_messages
            WHERE role='user' AND created_at BETWEEN :ini AND :fin
            GROUP BY intent
            ORDER BY n DESC LIMIT 10
        """), params).mappings().all()

        by_status = db.execute(text("""
            SELECT status, COUNT(*) AS n FROM tickets
            WHERE created_at BETWEEN :ini AND :fin GROUP BY status
        """), params).mappings().all()

        by_severity = db.execute(text("""
            SELECT severity, COUNT(*) AS n FROM tickets
            WHERE created_at BETWEEN :ini AND :fin GROUP BY severity
        """), params).mappings().all()

        by_day = db.execute(text("""
            SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS n
            FROM chat_messages
            WHERE role='user' AND created_at BETWEEN :ini AND :fin
            GROUP BY day ORDER BY day
        """), params).mappings().all()

    escalation_rate = (incidents / total_queries * 100) if total_queries else 0.0
    citation_cov = (citation["con"] / citation["total"] * 100) if citation["total"] else 0.0
    hours_saved = (resolved_without * MINUTES_SAVED_PER_QUERY) / 60.0

    return {
        "total_queries": total_queries,
        "resolved_without_escalation": resolved_without,
        "incidents_reported": incidents,
        "escalation_rate": round(escalation_rate, 2),
        "avg_latency_ms": round(float(latency["avg_ms"]), 1),
        "p95_latency_ms": round(float(latency["p95_ms"]), 1),
        "citation_coverage": round(citation_cov, 2),
        "hours_saved": round(hours_saved, 2),
        "top_topics": [dict(t) for t in top_topics],
        "tickets_by_status": {r["status"]: r["n"] for r in by_status},
        "tickets_by_severity": {r["severity"]: r["n"] for r in by_severity},
        "queries_by_day": [{"day": str(r["day"]), "count": r["n"]} for r in by_day],
    }


def summary(ini: datetime, fin: datetime) -> dict:
    # Cache 60s por bucket de inicio/fin
    key = f"metrics:{ini.isoformat()}:{fin.isoformat()}"
    cached = cache.get(key, "metrics")
    if cached:
        return cached
    data = _summary_uncached(ini, fin)
    cache.set(key, data, "metrics", ttl=60)
    return data