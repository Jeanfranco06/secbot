"""Clasificador de incidentes: reglas + LLM con parsing robusto."""
import json
import logging
import re
from typing import Optional

from langchain_ollama import OllamaLLM
from app.config import settings

log = logging.getLogger(__name__)

KEYWORDS: dict[str, list[str]] = {
    "phishing": ["phishing", "correo sospechoso", "enlace malicioso",
                 "remitente desconocido", "suplantación", "smishing", "vishing"],
    "malware": ["malware", "virus", "troyano", "ransomware", "cripto",
                "secuestro de datos", "proceso raro", "pantalla bloqueada"],
    "acceso": ["acceso no autorizado", "intruso", "login raro", "cuenta comprometida",
               "inicio de sesión sospechoso", "acceso indebido"],
    "credenciales": ["contraseña comprometida", "password filtrado", "credenciales",
                     "filtración", "haveibeenpwned", "cuenta expuesta"],
    "dispositivo": ["usb desconocida", "pérdida de portátil", "dispositivo perdido",
                    "robo de equipo", "móvil robado", "pendrive extraviado"],
}

SEVERITY_MAP: dict[str, str] = {
    "ransomware": "P1",
    "acceso": "P2",
    "credenciales": "P2",
    "phishing": "P2",
    "malware": "P2",
    "dispositivo": "P3",
}

PROMPT = """Eres un clasificador de incidentes de seguridad.
Devuelve EXCLUSIVAMENTE un objeto JSON válido con este esquema:
{{"is_incident": true|false, "category": "phishing|malware|acceso|credenciales|dispositivo|otro", "severity": "P1|P2|P3|P4", "confidence": 0.0}}

Reglas:
- P1: ransomware, compromiso masivo, pérdida de datos crítica.
- P2: phishing dirigido, credenciales comprometidas, acceso no autorizado.
- P3: dispositivo perdido sin datos sensibles, malware contenido.
- P4: consulta general, no incidente.

Mensaje: \"\"\"{msg}\"\"\"

JSON:"""


def _llm() -> OllamaLLM:
    return OllamaLLM(
        base_url=settings.ollama_base_url,
        model=settings.llm_model,
        temperature=0.0,
        num_predict=120,
        timeout=settings.llm_timeout_seconds,
    )


def _extract_json(raw: str) -> Optional[dict]:
    if not raw:
        return None
    # Buscar el primer { ... } balanceado
    start = raw.find("{")
    if start == -1:
        return None
    depth = 0
    for i in range(start, len(raw)):
        if raw[i] == "{":
            depth += 1
        elif raw[i] == "}":
            depth -= 1
            if depth == 0:
                candidate = raw[start:i + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    # Fallback: normalizar comillas simples
                    try:
                        return json.loads(candidate.replace("'", '"'))
                    except Exception:
                        return None
    return None


def _normalize(data: dict) -> dict:
    is_incident = bool(data.get("is_incident", False))
    category = str(data.get("category", "otro")).lower().strip()
    if category not in {"phishing", "malware", "acceso", "credenciales", "dispositivo", "otro"}:
        category = "otro"
    severity = str(data.get("severity", "P4")).upper().strip()
    if severity not in {"P1", "P2", "P3", "P4"}:
        severity = "P4"
    if not is_incident:
        severity = "P4"
    try:
        confidence = float(data.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))
    return {
        "is_incident": is_incident,
        "category": category,
        "severity": severity,
        "confidence": confidence,
    }


def _rule_hit(msg: str) -> Optional[tuple[str, float]]:
    low = msg.lower()
    for cat, kws in KEYWORDS.items():
        for kw in kws:
            if kw in low:
                return cat, 0.85
    return None


def classify(message: str) -> dict:
    if not message or not message.strip():
        return {"is_incident": False, "category": "otro", "severity": "P4", "confidence": 0.0}

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
        raw = _llm().invoke(PROMPT.format(msg=message[:1200]))
        parsed = _extract_json(raw) if isinstance(raw, str) else None
        if not parsed:
            log.warning("classifier_parse_failed", extra={"raw": (raw or "")[:200]})
            return {"is_incident": False, "category": "otro", "severity": "P4", "confidence": 0.0}
        return _normalize(parsed)
    except Exception as e:
        log.warning("classifier_llm_error", extra={"err": str(e)})
        return {"is_incident": False, "category": "otro", "severity": "P4", "confidence": 0.0}