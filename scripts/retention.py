"""Retención diferenciada por jurisdicción por usuario."""
from datetime import datetime, timedelta
from sqlalchemy import text
from app.database import SessionLocal

def _policy(db, j):
    row = db.execute(text("""
        SELECT chat_retention_days, ticket_retention_days
        FROM jurisdiction_policies WHERE id = :j
    """), {"j": j}).mappings().first()
    return row or {"chat_retention_days": 365, "ticket_retention_days": 730}

def run():
    with SessionLocal() as db:
        now = datetime.utcnow()

        # Chats por jurisdicción
        for j in db.execute(text("SELECT id FROM jurisdiction_policies")).scalars():
            pol = _policy(db, j)
            cutoff = now - timedelta(days=pol["chat_retention_days"])
            n = db.execute(text("""
                DELETE FROM chat_history
                WHERE started_at < :c
                  AND user_id IN (SELECT id FROM users WHERE jurisdiction = :j)
            """), {"c": cutoff, "j": j}).rowcount
            print(f"[{j}] chats={n}")

        # Tickets por jurisdicción
        for j in db.execute(text("SELECT id FROM jurisdiction_policies")).scalars():
            pol = _policy(db, j)
            cutoff = now - timedelta(days=pol["ticket_retention_days"])
            n = db.execute(text("""
                DELETE FROM tickets
                WHERE status IN ('cerrado','cancelado') AND updated_at < :c
                  AND reported_by IN (SELECT id FROM users WHERE jurisdiction = :j)
            """), {"c": cutoff, "j": j}).rowcount
            print(f"[{j}] tickets={n}")

        db.commit()

if __name__ == "__main__":
    run()