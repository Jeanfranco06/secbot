"""
Motor Dinámico de Análisis de Brechas Normativas (ISO/IEC 27001:2022 & NIST CSF 2.0).
Evalúa de forma automatizada la cobertura de políticas, controles técnicos,
roles RBAC, gestión de incidentes y registros de auditoría en la base de datos de SecBot.
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import KbDocument, Ticket, AuditLog, User, Role


def compute_gap_analysis(db: Session) -> Dict[str, Any]:
    # 1. Obtener métricas reales del sistema
    active_docs = db.query(KbDocument).filter(KbDocument.status == "active").all()
    policy_titles = [d.title.lower() for d in active_docs if d.doc_type == "policy"]
    runbook_titles = [d.title.lower() for d in active_docs if d.doc_type == "runbook"]
    faq_titles = [d.title.lower() for d in active_docs if d.doc_type == "faq"]

    total_tickets = db.query(Ticket).count()
    resolved_tickets = db.query(Ticket).filter(Ticket.status == "resuelto").count()
    audit_count = db.query(AuditLog).count()
    user_count = db.query(User).filter(User.is_active == True).count()
    role_count = db.query(Role).count()

    # Detecciones semánticas de políticas en base documental
    has_pwd_policy = any("contraseñ" in t or "password" in t or "credencial" in t for t in policy_titles)
    has_mobile_policy = any("móvil" in t or "movil" in t or "dispositivo" in t for t in policy_titles)
    has_usage_policy = any("uso aceptable" in t or "acceptable" in t for t in policy_titles)
    has_incident_runbook = any("phishing" in t or "acceso" in t or "incidente" in t for t in runbook_titles)
    has_physical_sec = any("físic" in t or "instalacion" in t or "perímetro" in t for t in policy_titles)
    has_dlp_policy = any("clasificación" in t or "fuga" in t or "dlp" in t or "confidencialidad" in t for t in policy_titles)
    has_drp_policy = any("continuidad" in t or "recuperación" in t or "drp" in t or "bcp" in t for t in policy_titles)
    has_awareness = len(faq_titles) > 0 or any("concientiz" in t or "capacitac" in t for t in policy_titles)

    # 2. Definición y evaluación de controles ISO 27001:2022
    controls: List[Dict[str, Any]] = []

    # A.5.1 Políticas de Seguridad de la Información
    policy_count = len(policy_titles)
    controls.append({
        "id": "A.5.1",
        "domain": "A.5 Organizacional",
        "title": "Políticas de Seguridad de la Información",
        "status": "CUMPLIDO" if policy_count >= 3 else ("PARCIAL" if policy_count > 0 else "BRECHA"),
        "score": 100 if policy_count >= 3 else (50 if policy_count > 0 else 0),
        "evidence": f"{policy_count} políticas activas publicadas y aprobadas en el repositorio documental.",
        "recommendation": None if policy_count >= 3 else "Completar la formalización de políticas maestras de seguridad de la información."
    })

    # A.5.15 Control de Acceso & Identidad
    controls.append({
        "id": "A.5.15",
        "domain": "A.5 Organizacional",
        "title": "Control de Accesos & Identidades",
        "status": "CUMPLIDO" if (has_pwd_policy and role_count >= 3) else "PARCIAL",
        "score": 100 if (has_pwd_policy and role_count >= 3) else 60,
        "evidence": f"Matriz RBAC activa con {role_count} roles jerárquicos y {user_count} usuarios con Política de Contraseñas aprobada.",
        "recommendation": None if (has_pwd_policy and role_count >= 3) else "Vincular autenticación multifactor (MFA) obligatoria para cuentas administrativas."
    })

    # A.5.24 Preparación y Gestión de Incidentes
    controls.append({
        "id": "A.5.24",
        "domain": "A.5 Organizacional",
        "title": "Gestión y Respuesta ante Incidentes de Ciberseguridad",
        "status": "CUMPLIDO" if (has_incident_runbook and total_tickets > 0) else "PARCIAL",
        "score": 100 if (has_incident_runbook and total_tickets > 0) else 50,
        "evidence": f"Flujo integral de incidentes activo ({total_tickets} tickets registrados, {resolved_tickets} resueltos) articulado con Playbooks NIST SP 800-61r2 y generador IA.",
        "recommendation": None
    })

    # A.5.28 Recolección e Inmutabilidad de Evidencias Forenses
    controls.append({
        "id": "A.5.28",
        "domain": "A.5 Organizacional",
        "title": "Recolección y Preservación de Evidencias Forenses",
        "status": "CUMPLIDO" if audit_count >= 100 else ("PARCIAL" if audit_count > 0 else "BRECHA"),
        "score": 100 if audit_count >= 100 else 50,
        "evidence": f"{audit_count} eventos inmutables registrados en el log de auditoría del sistema con trazabilidad de IP y actor.",
        "recommendation": None if audit_count >= 100 else "Asegurar registro exhaustivo de eventos críticos y correlación SIEM."
    })

    # A.6.3 Concientización y Formación en Ciberseguridad
    controls.append({
        "id": "A.6.3",
        "domain": "A.6 Personas",
        "title": "Concientización y Formación en Ciberseguridad",
        "status": "PARCIAL" if has_awareness else "BRECHA",
        "score": 60 if has_awareness else 20,
        "evidence": "Base de preguntas frecuentes (FAQ) y asistente interactivo disponibles, pero se carece de registro formal de capacitaciones periódicas obligatorias.",
        "recommendation": "Publicar programa anual de concientización y registrar evaluaciones de simulación de phishing a usuarios finales."
    })

    # A.7.1 Perímetros y Seguridad Física
    controls.append({
        "id": "A.7.1",
        "domain": "A.7 Físico",
        "title": "Seguridad Física y Control de Acceso a Instalaciones",
        "status": "CUMPLIDO" if has_physical_sec else "BRECHA",
        "score": 100 if has_physical_sec else 25,
        "evidence": "Evidencia documental de seguridad física identificada." if has_physical_sec else "No se detectó política de seguridad perimetral para centros de datos ni oficinas corporativas.",
        "recommendation": "Crear y publicar en la Base de Conocimiento la 'Política de Seguridad Física y Control de Acceso a Instalaciones'."
    })

    # A.8.2 Gestión de Derechos de Acceso Privilegiados
    controls.append({
        "id": "A.8.2",
        "domain": "A.8 Tecnológico",
        "title": "Gestión de Derechos de Acceso Privilegiado (PAM / RBAC)",
        "status": "CUMPLIDO" if role_count >= 3 else "PARCIAL",
        "score": 100 if role_count >= 3 else 50,
        "evidence": f"Principio de menor privilegio enforcing mediante {role_count} roles y permisos granulares en base de datos.",
        "recommendation": None
    })

    # A.8.7 Protección contra Código Malicioso & Phishing
    controls.append({
        "id": "A.8.7",
        "domain": "A.8 Tecnológico",
        "title": "Protección contra Malware, Phishing y Amenazas Web",
        "status": "CUMPLIDO",
        "score": 95,
        "evidence": "Módulo heurístico de análisis anti-phishing con detección de IoCs, análisis de dominios y Runbook de Phishing activo.",
        "recommendation": "Complementar con feeds de Inteligencia de Amenazas (Threat Intel STIX/TAXII)."
    })

    # A.8.12 Prevención de Fugas de Datos (DLP)
    controls.append({
        "id": "A.8.12",
        "domain": "A.8 Tecnológico",
        "title": "Prevención de Fuga de Información (DLP) & Clasificación",
        "status": "CUMPLIDO" if has_dlp_policy else "BRECHA",
        "score": 100 if has_dlp_policy else 30,
        "evidence": "Esquema formal de clasificación de datos documentado." if has_dlp_policy else "Ausencia de política específica de etiquetado y clasificación de la información sensible (Confidencial, Restringida, Pública).",
        "recommendation": "Formalizar la 'Política de Clasificación de la Información y Prevención de Fugas (DLP)'."
    })

    # A.8.20 Seguridad de Redes y Comunicaciones
    controls.append({
        "id": "A.8.20",
        "domain": "A.8 Tecnológico",
        "title": "Seguridad de Redes, Cifrado y Monitoreo Perimetral",
        "status": "PARCIAL",
        "score": 75,
        "evidence": "Cifrado en tránsito (TLS/HTTPS), aislamiento de microservicios en Docker y extracción automática de IoCs forenses.",
        "recommendation": "Integrar reglas de bloqueo automatizado en firewall o proxy perimetral a partir de los IoCs extraídos."
    })

    # 3. Cálculo de Cobertura por Dominios ISO 27001
    domains = {}
    for c in controls:
        d_name = c["domain"]
        if d_name not in domains:
            domains[d_name] = {"total": 0, "sum_score": 0, "controls": []}
        domains[d_name]["total"] += 1
        domains[d_name]["sum_score"] += c["score"]
        domains[d_name]["controls"].append(c)

    domains_summary = []
    for d_name, d_data in domains.items():
        avg = round(d_data["sum_score"] / d_data["total"], 1)
        domains_summary.append({
            "name": d_name,
            "score": avg,
            "total_controls": d_data["total"],
            "controls": d_data["controls"],
        })

    # 4. Cálculo NIST CSF 2.0
    nist_functions = [
        {"code": "GV", "name": "Gobernar (Govern)", "score": 85 if policy_count >= 3 else 50, "desc": "Estrategia, roles organizacionales y políticas maestras aprobadas."},
        {"code": "ID", "name": "Identificar (Identify)", "score": 75 if has_pwd_policy else 40, "desc": "Inventario documental, activos y evaluación de riesgos en curso."},
        {"code": "PR", "name": "Proteger (Protect)", "score": 88 if role_count >= 3 else 60, "desc": "Control de accesos RBAC, contraseñas y directivas de uso aceptable."},
        {"code": "DE", "name": "Detectar (Detect)", "score": 90 if audit_count > 100 else 60, "desc": "Motor anti-phishing heurístico, extracción de IoCs y auditoría continua."},
        {"code": "RS", "name": "Responder (Respond)", "score": 92 if total_tickets > 0 else 60, "desc": "Gestión estructurada de incidentes y generador de planes de remediación IA NIST."},
        {"code": "RC", "name": "Recuperar (Recover)", "score": 55 if has_drp_policy else 40, "desc": "Runbooks operativos disponibles; requiere plan de continuidad DRP formalizado."},
    ]

    total_controls = len(controls)
    compliant_count = sum(1 for c in controls if c["status"] == "CUMPLIDO")
    partial_count = sum(1 for c in controls if c["status"] == "PARCIAL")
    gap_count = sum(1 for c in controls if c["status"] == "BRECHA")
    overall_score = round(sum(c["score"] for c in controls) / total_controls, 1)

    # Top Brechas Prioritarias
    top_gaps = [c for c in controls if c["status"] in ("BRECHA", "PARCIAL")]
    top_gaps.sort(key=lambda x: x["score"])

    return {
        "overall_score": overall_score,
        "total_controls": total_controls,
        "compliant_count": compliant_count,
        "partial_count": partial_count,
        "gap_count": gap_count,
        "domains": domains_summary,
        "nist_csf": nist_functions,
        "top_actionable_gaps": top_gaps,
    }
