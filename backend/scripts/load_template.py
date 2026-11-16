"""Carga plantillas KB en la BD.
Uso: docker compose exec backend python -m scripts.load_template base
"""
import sys
from pathlib import Path
from app.ingestion.ingest import ingest_one

TEMPLATES = Path("kb_templates")

TITLES_MAP = {
    "politica_contrasenas": ("Política de Contraseñas", "2.1"),
    "politica_uso_aceptable": ("Política de Uso Aceptable", "1.0"),
    "politica_dispositivos_moviles": ("Política de Dispositivos Móviles", "1.0"),
    "runbook_phishing": ("Runbook de Respuesta ante Phishing", "1.0"),
    "runbook_acceso_no_autorizado": ("Runbook de Acceso No Autorizado", "1.0"),
    "runbook_perdida_portatil": ("Runbook de Pérdida de Portátil", "1.0"),
    "faq_general": ("FAQ General de Seguridad", "1.0"),
    "politica_fraude": ("Política de Prevención de Fraude", "1.0"),
    "politica_datos_ciudadano": ("Política de Datos del Ciudadano", "1.0"),
    "politica_datos_paciente": ("Política de Datos del Paciente", "1.0"),
}

def main():
    pack = sys.argv[1] if len(sys.argv) > 1 else "base"
    base = TEMPLATES / pack
    if not base.exists():
        sys.exit(f"No existe {base}")

    for f in sorted(base.iterdir()):
        if not f.is_file():
            continue
        doc_type = "faq" if f.stem.startswith("faq") else ("runbook" if "runbook" in f.stem else "policy")
        title, version = TITLES_MAP.get(f.stem, (f.stem.replace("_", " ").title(), "1.0"))
        section_split = doc_type != "faq"
        ingest_one(str(f), title=title,
                   doc_type=doc_type, version=version, owner="plantilla",
                   section_split=section_split, original_name=f.name)
        print(f"OK {f.name} -> {title} v{version}")

if __name__ == "__main__":
    main()
