"""Reenvía notificaciones de tickets no notificados a n8n."""
import httpx
from sqlalchemy import text
from app.database import SessionLocal
from app.config import settings

def main():
    with SessionLocal() as db:
        rows = db.execute(text("""
            SELECT id, ticket_number, severity, category, title, chat_id, reported_by
            FROM tickets
            WHERE metadata->>'notified' IS NULL
              AND created_at > now() - interval '7 days'
        """)).mappings().all()

        for r in rows:
            try:
                httpx.post(settings.n8n_webhook_url, json={
                    "ticket_id": str(r["id"]),
                    "ticket_number": r["ticket_number"],
                    "severity": r["severity"],
                    "category": r["category"],
                    "title": r["title"],
                    "chat_id": str(r["chat_id"]) if r["chat_id"] else None,
                    "reported_by": str(r["reported_by"]) if r["reported_by"] else None,
                }, headers={"X-N8N-Secret": settings.n8n_secret}, timeout=10)
                db.execute(text("""
                    UPDATE tickets SET metadata = metadata || '{"notified": true}'::jsonb
                    WHERE id = :id
                """), {"id": r["id"]})
                db.commit()
                print(f"OK {r['ticket_number']}")
            except Exception as e:
                print(f"FAIL {r['ticket_number']}: {e}")

if __name__ == "__main__":
    main()