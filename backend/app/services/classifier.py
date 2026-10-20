import json
import re
from langchain_ollama import OllamaLLM
from app.config import settings

KEYWORDS = {
    "phishing": ["phishing", "correo sospechoso", "enlace malicioso", "remitente desconocido"],
    "malware": ["malware", "virus", "troyano", "ransomware", "cripto"],
    "acceso": ["acceso no autorizado", "intruso", "login raro", "cuenta comprometida"],
    "credenciales": ["contraseña comprometida", "password filtrado", "credenciales"],
    "dispositivo": ["usb desconocida", "pérdida de portátil", "dispositivo perdido", "robo de equipo"],
}

SEVERITY_MAP = {
    "ransomware": "P1",
    "acceso": "P2",
    "credenciales": "P2",
    "phishing": "P2",
    "malware": "P2",
    "dispositivo": "P3",
}

_PROMPT = """Clasifica si el mensaje del empleado reporta un incidente de seguridad.
Devuelve SOLO JSON con este formato:
{"is_incident": true|false, "category": "phishing|malware|acceso|credenciales|dispositivo|otro", "severity": "P1|P2|P3|P4", "confidence": 0.0-1.0}

Mensaje: {msg}
JSON:"""

_llm = OllamaLLM(
    base_url=settings.ollama_base_url,
    model=settings.llm_model,
    temperature=0.0,
    num_predict=120,
)

def _rule_hit(msg: str) -> tuple[str, float] | None:
    low = msg.lower()
    for cat, kws in KEYWORDS.items():
        for kw in kws:
            if kw in low:
                return cat, 0.85
    return None

def classify(message: str) -> dict:
    rule = _rule_hit(message)
    if rule:
        cat, conf = rule
        return {
            "is_incident": True,
            "category": cat,
            "severity": SEVERITY_MAP.get(cat, "P3"),
            "confidence": conf,
        }
    try:
        raw = _llm.invoke(_PROMPT.format(msg=message[:800]))
        raw = re.sub(r"^[^{]*", "", raw).strip()
        data = json.loads(raw)
        return {
            "is_incident": bool(data.get("is_incident", False)),
            "category": str(data.get("category", "otro")),
            "severity": str(data.get("severity", "P3")),
            "confidence": float(data.get("confidence", 0.0)),
        }
    except Exception:
        return {"is_incident": False, "category": "otro", "severity": "P4", "confidence": 0.0}