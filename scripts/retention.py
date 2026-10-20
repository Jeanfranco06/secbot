"""Aplicar política de retención.
Uso: docker compose exec backend python -m scripts.retention
Cron sugerido: diario 03:00
"""
from datetime import datetime, timedelta
from sqlalchemy import text
from app.database import SessionLocal

RETENTION_DAYS = {
    "chat_history": 365,
    "chat_messages": 365,
    "tickets": 730,
    "audit_log": 1825,
    "report_exports": 90,
}

def run():
    with SessionLocal() as db:
        now = datetime.utcnow()

        # Chat: eliminar conversaciones antiguas (cascada borra mensajes)
        cutoff_chat = now - timedelta(days=RETENTION_DAYS["chat_history"])
        n_chat = db.execute(text(
            "DELETE FROM chat_history WHERE started_at < :c"
        ), {"c": cutoff_chat}).rowcount

        # Tickets cerrados antiguos
        cutoff_tk = now - timedelta(days=RETENTION_DAYS["tickets"])
        n_tk = db.execute(text("""
            DELETE FROM tickets
            WHERE status IN ('cerrado','cancelado') AND updated_at < :c
        """), {"c": cutoff_tk}).rowcount

        # Reportes exportados (archivos)
        import os
        cutoff_rep = now - timedelta(days=RETENTION_DAYS["report_exports"])
        rows = db.execute(text("""
            SELECT id, file_path FROM report_exports WHERE created_at < :c
        """), {"c": cutoff_rep}).mappings().all()
        for r in rows:
            try:
                if r["file_path"] and os.path.exists(r["file_path"]):
                    os.remove(r["file_path"])
            except Exception:
                pass
        n_rep = db.execute(text(
            "DELETE FROM report_exports WHERE created_at < :c"
        ), {"c": cutoff_rep}).rowcount

        db.commit()
        print(f"[retention] chat={n_chat} tickets={n_tk} reports={n_rep}")

if __name__ == "__main__":
    run()