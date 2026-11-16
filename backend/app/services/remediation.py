"""Servicio de generación de planes de remediación y post-mortem asistidos por IA."""
import json
import logging
import re
from typing import Optional
from sqlalchemy.orm import Session
from app import models
from app.services import rag

log = logging.getLogger(__name__)

# Plantillas maestras de respuesta a incidentes por categoría según NIST SP 800-61r2
FRAMEWORK_PLAYBOOKS = {
    "phishing": {
        "summary_template": "Incidente de ingeniería social mediante correo electrónico sospechoso con posible intento de suplantación de identidad (spoofing/credential harvesting).",
        "immediate_containment": [
            "Aislar de la red interna las estaciones de trabajo de los usuarios afectados (desconectar Ethernet y apagar Wi-Fi).",
            "Purgar el mensaje malicioso de todos los buzones corporativos mediante búsqueda por Message-ID y Asunto.",
            "Bloquear inmediatamente en el firewall de perímetro y proxy web las URLs y dominios de destino detectados.",
            "Forzar cierre de todas las sesiones activas (revocar tokens OAuth y JWT) de las cuentas objetivo.",
        ],
        "eradication": [
            "Forzar reseteo preventivo de contraseñas de las cuentas comprometidas con verificación MFA fuera de banda.",
            "Revisar reglas de reenvío automático o delegación de correo creadas en los últimos 7 días en los buzones afectados.",
            "Escanear con solución EDR/Antivirus los endpoints de los usuarios que interactuaron con los enlaces o adjuntos.",
        ],
        "long_term_remediation": [
            "Ajustar los registros SPF, DKIM y DMARC en modo 'reject' (p=reject) en la pasarela de correo corporativo.",
            "Programar campaña de concientización y simulación de phishing dirigida al departamento involucrado.",
            "Actualizar la Base de Conocimiento con el nuevo indicador de compromiso (IoC) y notificar al CSIRT sectorial.",
        ],
        "affected_controls": ["ISO 27001:2022 §A.5.14 (Transferencia de información)", "NIST CSF PR.AT-1 (Concientización)", "CIS Control 9 (Defensas de correo y navegador)"],
    },
    "malware": {
        "summary_template": "Detección de artefacto binario o script potencialmente malicioso en endpoint corporativo con riesgo de ejecución no autorizada o movimiento lateral.",
        "immediate_containment": [
            "Aislar el host inmediatamente mediante EDR/VLAN de cuarentena para impedir comunicación hacia comando y control (C2).",
            "Terminar los procesos sospechosos en memoria y capturar volcado de memoria RAM para análisis forense.",
            "Bloquear la dirección IP de origen y hashes SHA256 asociados en el firewall perimetral y proxies.",
        ],
        "eradication": [
            "Remover llaves de persistencia en registro de Windows (Run/RunOnce), tareas programadas y servicios no firmados.",
            "Eliminar los binarios en cuarentena y verificar integridad de archivos del sistema operativo (sfc /scannow).",
            "Restaurar el endpoint a un punto de restauración seguro o reinstalar la imagen base corporativa homologada.",
        ],
        "long_term_remediation": [
            "Endurecer políticas de AppLocker/WDAC para restringir ejecución de ejecutables en AppData y Temp.",
            "Garantizar cobertura del 100% de firmas y heurística avanzada en toda la flota de estaciones de trabajo.",
            "Revisar el vector de entrada (descarga web, USB o correo) y aplicar control compensatorio.",
        ],
        "affected_controls": ["ISO 27001:2022 §A.8.7 (Protección contra malware)", "NIST CSF DE.CM-4 (Monitoreo de código malicioso)", "CIS Control 10 (Defensas contra malware)"],
    },
    "acceso": {
        "summary_template": "Anomalía en el control de acceso lógico o detección de inicio de sesión sospechoso fuera de horario/geolocalización habitual.",
        "immediate_containment": [
            "Bloquear temporalmente la cuenta de usuario afectada en el Directorio Activo / Identity Provider.",
            "Revocar inmediatamente todas las sesiones activas, cookies de autenticación y tokens móviles.",
            "Bloquear la dirección IP de procedencia del intento de intrusión en el WAF y balanceador de carga.",
        ],
        "eradication": [
            "Inspeccionar los registros de autenticación en busca de accesos concurrentes o técnicas de password spraying.",
            "Validar y reiniciar el factor de autenticación múltiple (MFA) del usuario en persona o por canal verificado.",
            "Auditar elevación de privilegios o cambios en grupos de seguridad (Domain Admins, Remote Desktop Users).",
        ],
        "long_term_remediation": [
            "Configurar políticas de Acceso Condicional basadas en riesgo de usuario y ubicación geográfica permitida.",
            "Implementar detección de viajes imposibles (impossible travel) en la plataforma SIEM.",
            "Revisar la política corporativa de contraseñas y rotación de claves de servicio.",
        ],
        "affected_controls": ["ISO 27001:2022 §A.9.4 (Gestión de autenticación)", "NIST CSF PR.AC-7 (Autenticación fuerte)", "CIS Control 6 (Gestión de control de acceso)"],
    },
    "credenciales": {
        "summary_template": "Exposición o compromiso de credenciales corporativas en brechas públicas o intentos de filtración interna.",
        "immediate_containment": [
            "Inhabilitar la contraseña comprometida y suspender el acceso de la cuenta afectada.",
            "Invalidar llaves API, tokens de acceso personal (PAT) y certificados vinculados a la identidad.",
        ],
        "eradication": [
            "Establecer una nueva contraseña segura que cumpla la política de 16 caracteres mínimos y caracteres especiales.",
            "Activar obligatoriamente autenticación multifactor (FIDO2 o TOTP) si no estaba habilitada.",
            "Revisar el historial de transacciones o acciones ejecutadas durante la ventana temporal de exposición.",
        ],
        "long_term_remediation": [
            "Integrar monitoreo automatizado de credenciales filtradas (Threat Intelligence / HaveIBeenPwned API).",
            "Prohibir el uso de contraseñas corporativas en servicios y plataformas de ocio personal.",
        ],
        "affected_controls": ["ISO 27001:2022 §A.9.2.4 (Gestión de información secreta)", "NIST CSF PR.AC-1 (Identidades y credenciales)"],
    },
    "dispositivo": {
        "summary_template": "Extravío, robo o conexión de dispositivo no autorizado (medio extraíble USB o computadora portátil corporativa).",
        "immediate_containment": [
            "Ejecutar bloqueo remoto inmediato del equipo mediante la consola MDM / EDR corporativa.",
            "Si no es recuperable o contiene datos confidenciales, iniciar borrado remoto de fábrica (Remote Wipe).",
            "Revocar certificados digitales corporativos y VPN instalados en el dispositivo.",
        ],
        "eradication": [
            "Confirmar el estado de cifrado BitLocker / FileVault del disco en la consola de gestión de flota.",
            "Cambiar las contraseñas de todos los servicios corporativos a los que el dispositivo tenía acceso guardado.",
        ],
        "long_term_remediation": [
            "Reforzar la política de bloqueo de puertos USB para medios de almacenamiento masivo no homologados.",
            "Exigir cifrado total de disco obligatorio para el 100% de portátiles antes de su entrega al personal.",
        ],
        "affected_controls": ["ISO 27001:2022 §A.8.1 (Dispositivos de usuario final)", "NIST CSF PR.DS-1 (Protección de datos en reposo)"],
    },
}

DEFAULT_PLAYBOOK = {
    "summary_template": "Incidente operacional de seguridad de la información reportado a través de canales corporativos.",
    "immediate_containment": [
        "Identificar los activos de información y sistemas involucrados para delimitar el alcance del evento.",
        "Preservar la evidencia digital (registros del sistema, logs de tráfico y volcados de memoria).",
        "Comunicar la contingencia al responsable del área afectada.",
    ],
    "eradication": [
        "Subsanar la vulnerabilidad o causa raíz identificada que permitió la ocurrencia del incidente.",
        "Validar la integridad de los sistemas y bases de datos antes de reanudar operaciones normales.",
    ],
    "long_term_remediation": [
        "Documentar las lecciones aprendidas en el comité de seguridad de la información.",
        "Actualizar los procedimientos operativos y runbooks en la Base de Conocimiento.",
    ],
    "affected_controls": ["ISO 27001:2022 §A.5.24 (Planificación de incidentes)", "NIST CSF RS.RP-1 (Plan de respuesta)"],
}


def generate_remediation_plan(
    ticket: models.Ticket,
    db: Session,
    use_llm: bool = True,
) -> dict:
    """Genera un plan de acción estructurado y forense para la atención y cierre del incidente."""
    cat = (ticket.category or "otro").lower().strip()
    playbook = FRAMEWORK_PLAYBOOKS.get(cat, DEFAULT_PLAYBOOK)

    # Contexto documental de RAG si existe
    kb_context = ""
    try:
        hits = rag.retrieve(f"{cat} {ticket.title} runbook procedimiento mitigacion", top_k=2)
        if hits:
            kb_context = "\n".join([f"- {h['title']} ({h.get('section', 'General')}): {h['content'][:250]}..." for h in hits])
    except Exception as e:
        log.warning("kb_context_retrieval_failed", extra={"err": str(e)})

    # Estructura del plan
    summary = f"{playbook['summary_template']} Incidente '{ticket.title}' con severidad {ticket.severity}."
    immediate = list(playbook["immediate_containment"])
    eradication = list(playbook["eradication"])
    long_term = list(playbook["long_term_remediation"])
    controls = list(playbook["affected_controls"])

    # Personalización dinámica según los datos específicos del ticket
    if ticket.description and len(ticket.description) > 10:
        desc_low = ticket.description.lower()
        if "enlace" in desc_low or "link" in desc_low or "url" in desc_low:
            immediate.insert(0, "Enviar el enlace sospechoso a entorno Sandbox aislado para extracción de cadena de redirección.")
        if "adjunto" in desc_low or "archivo" in desc_low or ".exe" in desc_low or ".zip" in desc_low:
            eradication.insert(0, "Extraer hash SHA256 del archivo adjunto y cotejar contra bases de inteligencia de amenazas.")
        if "tarjeta" in desc_low or "dni" in desc_low or "credencial" in desc_low:
            immediate.insert(0, "Declarar potencial evento de fuga de datos sensibles (PII) ante el Oficial de Cumplimiento (DPO).")

    # Formatear reporte consolidado en Markdown
    formatted_markdown = f"""### 🛡️ Plan de Remediación & Post-Mortem Automatizado
**Ticket:** `{ticket.ticket_number}` | **Severidad:** `{ticket.severity}` | **Categoría:** `{ticket.category or 'General'}`

#### 1. Resumen Ejecutivo
{summary}

#### 2. Fase de Contención Inmediata (SLA < 1h)
{chr(10).join([f"- [ ] {act}" for act in immediate])}

#### 3. Fase de Erradicación & Limpieza
{chr(10).join([f"- [ ] {act}" for act in eradication])}

#### 4. Remediación a Largo Plazo & Prevención
{chr(10).join([f"- [ ] {act}" for act in long_term])}

#### 5. Controles de Seguridad Afectados
{chr(10).join([f"- **{c}**" for c in controls])}

---
*Generado automáticamente por SecBot Copilot utilizando estándares NIST SP 800-61r2 e ISO/IEC 27001.*
"""

    return {
        "ticket_id": str(ticket.id),
        "ticket_number": ticket.ticket_number,
        "category": ticket.category or "otro",
        "severity": ticket.severity,
        "title": ticket.title,
        "plan": {
            "summary": summary,
            "immediate_containment": immediate,
            "eradication": eradication,
            "long_term_remediation": long_term,
            "affected_controls": controls,
            "kb_citations_found": bool(kb_context),
            "formatted_report": formatted_markdown,
        },
    }
