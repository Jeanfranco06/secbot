"""Exporta dataset para fine-tuning del clasificador.
Formato: JSONL con instruction/input/output.
Uso: docker compose exec backend python -m scripts.export_training
"""
import json
from pathlib import Path
from sqlalchemy import text
from app.database import SessionLocal

OUT = Path("/tmp/classifier_train.jsonl")

def main():
    with SessionLocal() as db:
        rows = db.execute(text("""
            SELECT cm.content, cl.true_is_incident, cl.true_category, cl.true_severity
            FROM classifier_labels cl
            JOIN chat_messages cm ON cm.id = cl.message_id
        """)).mappings().all()

    with OUT.open("w") as f:
        for r in rows:
            out = {
                "is_incident": r["true_is_incident"],
                "category": r["true_category"],
                "severity": r["true_severity"],
                "confidence": 1.0,
            }
            f.write(json.dumps({
                "instruction": "Clasifica si el mensaje reporta un incidente de seguridad.",
                "input": r["content"],
                "output": json.dumps(out, ensure_ascii=False),
            }, ensure_ascii=False) + "\n")

    print(f"Escrito {OUT} ({len(rows)} ejemplos)")

if __name__ == "__main__":
    main()