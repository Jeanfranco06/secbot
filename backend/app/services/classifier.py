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

    # Detección heurística de phishing / ingeniería social / robo de credenciales
    has_url = any(u in low for u in ["http://", "https://", "www.", ".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".xyz", ".cc", ".buzz"])
    has_urgency = any(w in low for w in [
        "urgente", "congelan", "congelar", "suspenden", "suspensión", "suspension",
        "bloqueo", "bloquear", "inmediato", "24 horas", "48 horas", "supuesto",
        "suplant", "gerente general", "ceo", "rrhh", "liquidaci"
    ])
    has_creds = any(w in low for w in [
        "clave", "password", "contraseña", "contrasena", "dni", "credencial",
        "token", "login", "cuenta", "banco", "validar", "verificar"
    ])
    has_comms = any(w in low for w in [
        "correo", "email", "mensaje", "enlace", "link", "remitente", "adjunto", "portal"
    ])

    # Si hay enlace combinado con urgencia o solicitud de credenciales
    if has_url and (has_urgency or has_creds):
        return "phishing", 0.90

    # Si hay contexto de correo con urgencia y solicitud de credenciales
    if has_comms and has_urgency and has_creds:
        return "phishing", 0.88

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


def infer_topic(
    message: str,
    citations: Optional[list] = None,
    incident_category: Optional[str] = None,
) -> str:
    """Infiere el tema o política de seguridad de una consulta de forma robusta y legible."""
    # 1. Si hay citas normativas de RAG, el documento citado es la fuente más precisa
    if citations:
        for c in citations:
            raw_title = (c.get("title") or "").strip()
            if raw_title:
                title = raw_title.replace("_", " ").replace(".md", "").strip()
                title = re.sub(r"\s+v\d+(\.\d+)?", "", title, flags=re.IGNORECASE).strip()
                low = title.lower()
                if "contrase" in low or "password" in low:
                    return "Política de Contraseñas"
                elif "phishing" in low or "correo" in low:
                    return "Runbook de Phishing"
                elif "dispositivo" in low or "móvil" in low or "movil" in low or "usb" in low:
                    return "Política de Dispositivos Móviles"
                elif "uso aceptable" in low:
                    return "Política de Uso Aceptable"
                elif "acceso" in low:
                    return "Runbook de Acceso No Autorizado"
                elif "pérdida" in low or "perdida" in low or "portátil" in low or "portatil" in low:
                    return "Runbook de Pérdida de Portátil"
                elif "faq" in low:
                    return "FAQ General de Seguridad"
                return title.title()

    # 2. Si es incidente clasificado con categoría específica
    if incident_category and incident_category.lower() not in ("otro", "consulta", "knowledge_query", "sin_clasificar"):
        cat_map = {
            "phishing": "Phishing y Correo Sospechoso",
            "malware": "Malware y Ransomware",
            "acceso": "Control de Acceso e Intrusiones",
            "credenciales": "Compromiso de Credenciales",
            "dispositivo": "Dispositivos y Medios Extraíbles",
        }
        return cat_map.get(incident_category.lower(), incident_category.title())

    # 3. Análisis heurístico y semántico por palabras clave en el mensaje
    low_msg = (message or "").lower()
    if any(k in low_msg for k in ["contraseñ", "password", "clave", "pin", "credencial", "longitud mínima", "complejidad"]):
        return "Política de Contraseñas"
    if any(k in low_msg for k in ["phishing", "correo sospechoso", "email sospechoso", "enlace sospechoso", "suplantaci", "smishing"]):
        return "Runbook de Phishing"
    if any(k in low_msg for k in ["usb", "pendrive", "disco externo", "dispositivo personal", "móvil", "celular", "laptop"]):
        return "Política de Dispositivos Móviles"
    if any(k in low_msg for k in ["uso aceptable", "redes sociales", "descargar software", "descarga", "navegación"]):
        return "Política de Uso Aceptable"
    if any(k in low_msg for k in ["acceso no autorizado", "inicio de sesión sospechoso", "intruso", "mfa", "2fa"]):
        return "Runbook de Acceso No Autorizado"
    if any(k in low_msg for k in ["perdí mi portátil", "robo de equipo", "portátil extraviado", "laptop perdida"]):
        return "Runbook de Pérdida de Portátil"
    if any(k in low_msg for k in ["incidente", "reportar incidente", "severidad", "fuga de datos", "brecha"]):
        return "Gestión de Incidentes"

    return "Consultas Generales"
