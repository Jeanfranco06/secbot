"""Carga plantillas KB en la BD.
Uso: docker compose exec backend python -m scripts.load_template base
"""
import sys
from pathlib import Path
from app.ingestion.ingest import ingest_one

TEMPLATES = Path("kb_templates")

def main():
    pack = sys.argv[1] if len(sys.argv) > 1 else "base"
    base = TEMPLATES / pack
    if not base.exists():
        sys.exit(f"No existe {base}")

    for f in base.iterdir():
        doc_type = "faq" if f.stem.startswith("faq") else ("runbook" if "runbook" in f.stem else "policy")
        ingest_one(str(f), title=f.stem.replace("_", " ").title(),
                   doc_type=doc_type, version="1.0", owner="plantilla",
                   section_split=True, original_name=f.name)
        print(f"OK {f.name}")

if __name__ == "__main__":
    main()