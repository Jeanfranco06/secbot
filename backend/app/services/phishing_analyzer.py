"""Motor de análisis heurístico y forense de correos sospechosos y anti-phishing."""
import re
from typing import Optional
from app.services import ioc_parser

# Palabras de urgencia / coerción psicológica
URGENCY_KEYWORDS = [
    "urgente", "inmediato", "24 horas", "48 horas", "2 horas", "suspensión",
    "bloqueo", "cuenta suspendida", "acceso revocado", "evite el cierre",
    "acción requerida", "último aviso", "penalización", "demanda", "legal",
    "multa", "cancelación", "expira hoy"
]

CREDENTIAL_HARVESTING_KEYWORDS = [
    "contraseña", "password", "verificar cuenta", "confirmar identidad",
    "actualizar datos", "iniciar sesión aquí", "validar credenciales",
    "tarjeta de crédito", "número de cuenta", "pin de seguridad", "token"
]

FINANCIAL_KEYWORDS = [
    "transferencia urgente", "pago pendiente", "factura adjunta", "reembolso",
    "premio", "lotería", "herencia", "criptomoneda", "bitcoin", "banco"
]

FREE_MAIL_DOMAINS = {
    "gmail.com", "hotmail.com", "yahoo.com", "outlook.com", "live.com",
    "icloud.com", "protonmail.com", "mail.com", "aol.com"
}

POPULAR_BRANDS = [
    "microsoft", "office365", "google", "apple", "paypal", "netflix",
    "banco", "santander", "bbva", "amazon", "dropbox", "dhl", "fedex"
]


def analyze_email(sender: str, subject: str, body: str) -> dict:
    sender = (sender or "").strip()
    subject = (subject or "").strip()
    body = (body or "").strip()

    full_text = f"{sender} {subject} {body}".lower()
    red_flags = []
    risk_score = 10

    # 1. Análisis del Remitente
    sender_domain = ""
    is_free_provider = False
    is_suspicious_tld = False
    typosquatting_detected = False

    if "@" in sender:
        parts = sender.split("@")
        sender_domain = parts[-1].lower().strip()
        if sender_domain in FREE_MAIL_DOMAINS:
            is_free_provider = True
            # Si el asunto o cuerpo habla de cuentas corporativas o bancos, es una bandera roja grande
            if any(b in full_text for b in POPULAR_BRANDS) or "soporte" in sender.lower() or "admin" in sender.lower():
                risk_score += 35
                red_flags.append(f"Uso de proveedor de correo gratuito ({sender_domain}) simulando comunicaciones oficiales o soporte.")

        for tld in ioc_parser.SUSPICIOUS_TLDS:
            if sender_domain.endswith(tld):
                is_suspicious_tld = True
                risk_score += 30
                red_flags.append(f"Dominio del remitente ({sender_domain}) utiliza un TLD de alto riesgo o reputación dudosa ({tld}).")
                break

        # Typosquatting
        for brand in POPULAR_BRANDS:
            if brand in sender_domain and not sender_domain.endswith(f"{brand}.com") and not sender_domain.endswith(f"{brand}.es"):
                typosquatting_detected = True
                risk_score += 40
                red_flags.append(f"Posible falsificación de identidad (Typosquatting/Impersonation) de la marca '{brand.capitalize()}'.")
                break

    # 2. Análisis de Ingeniería Social y Urgencia
    urgency_hits = [k for k in URGENCY_KEYWORDS if k in full_text]
    if urgency_hits:
        risk_score += min(30, len(urgency_hits) * 12)
        red_flags.append(f"Tácticas de coacción y urgencia psicológica detectadas: {', '.join(urgency_hits[:3])}.")

    # 3. Solicitud de Credenciales o Datos Sensibles
    cred_hits = [k for k in CREDENTIAL_HARVESTING_KEYWORDS if k in full_text]
    if cred_hits:
        risk_score += min(35, len(cred_hits) * 15)
        red_flags.append(f"Solicitud explícita de credenciales o verificación sensible: {', '.join(cred_hits[:3])}.")

    # 4. Solicitudes Financieras o Facturas
    fin_hits = [k for k in FINANCIAL_KEYWORDS if k in full_text]
    if fin_hits:
        risk_score += min(20, len(fin_hits) * 8)
        red_flags.append(f"Mención a transacciones financieras, pagos o adjuntos no solicitados: {', '.join(fin_hits[:2])}.")

    # 5. Extracción de IoCs (Enlaces y Direcciones)
    raw_iocs = ioc_parser.extract_iocs(f"{subject} {body}")
    critical_urls = [i for i in raw_iocs if i["type"] == "url"]
    if critical_urls:
        risk_score += 25
        red_flags.append(f"Presencia de {len(critical_urls)} enlace(s) web incrustado(s) en el cuerpo del mensaje.")

    # Normalizar puntaje a 0-100
    risk_score = max(5, min(99, risk_score))

    # Determinar Veredicto
    if risk_score >= 65:
        verdict = "PHISHING CRÍTICO"
        verdict_level = "danger"
        recommendations = [
            "NO haga clic en ningún enlace ni descargue archivos adjuntos del correo.",
            "Aisle la estación de trabajo si ha ingresado contraseñas en el formulario de destino.",
            "Reporte el incidente de inmediato al equipo SOC para bloquear el remitente en el gateway corporativo.",
        ]
    elif risk_score >= 35:
        verdict = "CORREO SOSPECHOSO"
        verdict_level = "warning"
        recommendations = [
            "Valide la identidad del remitente a través de un canal secundario fuera de banda (llamada telefónica o Teams).",
            "Inspeccione cuidadosamente la URL de destino antes de interactuar.",
            "Mantenga el correo en cuarentena mientras se verifica con el área de TI.",
        ]
    else:
        verdict = "PROBABLEMENTE LEGÍTIMO"
        verdict_level = "success"
        recommendations = [
            "No se detectaron patrones evidentes de suplantación o ingeniería social maliciosa.",
            "Como buena práctica, verifique siempre que los enlaces comiencen con HTTPS y correspondan al dominio oficial.",
        ]

    return {
        "risk_score": risk_score,
        "verdict": verdict,
        "verdict_level": verdict_level,
        "red_flags": red_flags,
        "sender_analysis": {
            "sender": sender,
            "domain": sender_domain,
            "is_free_provider": is_free_provider,
            "is_suspicious_tld": is_suspicious_tld,
            "typosquatting_detected": typosquatting_detected,
        },
        "iocs_found": raw_iocs,
        "recommendations": recommendations,
    }
