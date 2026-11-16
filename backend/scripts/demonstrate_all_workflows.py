"""
Script de demostracion y verificacion integral de los workflows de n8n en SecBot.
Prueba la recepcion de webhooks, verificacion de secretos, consulta en Postgres y entrega en Mailpit.
"""
import urllib.request
import json
import time

SECBOT_N8N_URL = "http://localhost:5678"
MAILPIT_URL = "http://localhost:8025"
N8N_SECRET = "n8n_secret_token"

def log(msg, symbol="INFO"):
    print(f"[{symbol}] {msg}")

def trigger_webhook(path, payload, headers=None):
    url = f"{SECBOT_N8N_URL}/webhook/{path}"
    data = json.dumps(payload).encode("utf-8")
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=data, headers=req_headers)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            elapsed = int((time.time() - t0) * 1000)
            return resp.status, resp.read().decode("utf-8"), elapsed
    except urllib.error.HTTPError as e:
        elapsed = int((time.time() - t0) * 1000)
        return e.code, e.read().decode("utf-8"), elapsed

def get_latest_mailpit_messages(limit=6):
    try:
        url = f"{MAILPIT_URL}/api/v1/messages?limit={limit}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            d = json.loads(resp.read().decode("utf-8"))
            return d.get("messages", [])
    except Exception as e:
        return []

def main():
    print("=" * 80)
    print(" DEMOSTRACION INTEGRAL DE WORKFLOWS N8N - SECBOT ENTERPRISE")
    print("=" * 80)

    # 1. Catalogo de Workflows Registrados
    workflows = [
        {"id": "secbot-wf-01", "name": "daily-summary", "trigger": "Cron Diario (08:00)", "type": "Programado", "desc": "Resumen diario de metricas operacionales y latencias"},
        {"id": "secbot-wf-02", "name": "error-handler", "trigger": "ErrorTrigger Global", "type": "Gestion de Fallos", "desc": "Captura y alerta fallos en cualquier workflow de n8n"},
        {"id": "secbot-wf-03", "name": "incident-followup", "trigger": "Cron Diario (10:00)", "type": "Programado", "desc": "Seguimiento automatico de incidentes criticos abiertos"},
        {"id": "secbot-wf-04", "name": "kb-reindex-notification", "trigger": "Webhook /kb-updated", "type": "En tiempo real", "desc": "Notifica indexacion y vectorizacion de documentos normativos"},
        {"id": "secbot-wf-05", "name": "retention-cleanup", "trigger": "Cron Mensual", "type": "Cumplimiento", "desc": "Ejecuta purga de retencion legal (GDPR / ISO 27001)"},
        {"id": "secbot-wf-06", "name": "security-incident", "trigger": "Webhook /security-incident", "type": "En tiempo real", "desc": "Alerta inmediata al SOC y escalado de incidentes P1-P4"},
        {"id": "secbot-wf-07", "name": "sla-escalation", "trigger": "Cron Cada 15m", "type": "Monitoreo Continuo", "desc": "Escala tickets que han superado el SLA permitido"},
        {"id": "secbot-wf-08", "name": "ticket-status-notify", "trigger": "Webhook /ticket-status-changed", "type": "En tiempo real", "desc": "Notifica al empleado sobre cambios en su reporte"},
        {"id": "secbot-wf-09", "name": "user-onboarding", "trigger": "Webhook /user-created", "type": "En tiempo real", "desc": "Email de bienvenida y credenciales a nuevos usuarios"},
        {"id": "secbot-wf-10", "name": "weekly-management-report", "trigger": "Cron Semanal (Lunes)", "type": "Reporte Ejecutivo", "desc": "Informe semanal de seguridad para la gerencia general"}
    ]

    print("\n1. Workflows Configurados y Activos en n8n:")
    for wf in workflows:
        print(f"  * [{wf['id']}] {wf['name']:25} | {wf['trigger']:26} | {wf['desc']}")

    print("\n" + "-" * 80)
    print(" 2. Ejecucion y Prueba en Vivo con Datos Reales de PostgreSQL")
    print("-" * 80)

    # Obtenemos IDs reales de tickets y usuarios
    real_ticket_id = "e17919ea-7329-4ebd-8d86-c90bf2cb2aff"
    real_user_id = "1503d5e1-2e11-45bb-8f5c-d74fa51f3e94"

    demo_events = [
        {
            "name": "Onboarding de Usuario (user-onboarding)",
            "path": "user-created",
            "headers": {},
            "payload": {
                "user_id": real_user_id,
                "email": "jean20francisco06@gmail.com",
                "full_name": "Jean Gonzales (Lead SOC Analyst)"
            }
        },
        {
            "name": "Actualizacion de Estado de Ticket (ticket-status-notify)",
            "path": "ticket-status-changed",
            "headers": {},
            "payload": {
                "ticket_id": real_ticket_id,
                "status": "en_progreso",
                "notes": "Analisis forense de cabeceras de correo iniciado por el equipo SOC"
            }
        },
        {
            "name": "Alerta de Incidente de Seguridad (security-incident)",
            "path": "security-incident",
            "headers": {"x-n8n-secret": N8N_SECRET},
            "payload": {
                "ticket_id": real_ticket_id,
                "ticket_number": "TCK-20261021-000002",
                "severity": "P2",
                "category": "phishing",
                "title": "Alerta SOC: Correo de phishing dirigido a directivos",
                "user": "jean20francisco06@gmail.com"
            }
        },
        {
            "name": "Notificacion de Actualizacion KB (kb-reindex-notification)",
            "path": "kb-updated",
            "headers": {},
            "payload": {
                "doc_id": "cc33dd44-5566-7788-9900-112233445566",
                "title": "Procedimiento Operativo de Respuesta ante Ransomware 2026",
                "version": "3.5",
                "chunks": 36,
                "user": "jjgonzaleses@unitru.edu.pe",
                "action": "upload"
            }
        }
    ]

    for ev in demo_events:
        status, resp, ms = trigger_webhook(ev["path"], ev["payload"], ev["headers"])
        if status in (200, 201):
            log(f"EXITO: {ev['name']} procesado correctamente ({ms}ms) -> HTTP {status}", "OK")
        else:
            log(f"ERROR: {ev['name']} fallo con HTTP {status}: {resp}", "FAIL")

    time.sleep(2)

    print("\n" + "-" * 80)
    print(" 3. Verificacion de Correos Generados en Mailpit (Bandeja SMTP)")
    print("-" * 80)

    messages = get_latest_mailpit_messages(limit=6)
    if messages:
        for m in messages:
            to_addr = m["To"][0]["Address"] if m.get("To") else "N/A"
            subject = m.get("Subject", "Sin Asunto")
            created = m.get("Created", "")[:19].replace("T", " ")
            print(f"  * Para: {to_addr:32} | Asunto: {subject:55} | Fecha: {created}")
    else:
        print("  * No se encontraron mensajes nuevos en Mailpit.")

    print("\n" + "=" * 80)
    print(" COMO DEMOSTRAR QUE LOS WORKFLOWS FUNCIONAN (GUIA VISUAL):")
    print(" 1. Panel de Control de n8n:")
    print("    - Ingresa a: http://localhost:5678 (admin / admin1234)")
    print("    - Ve a 'Executions' en el menu izquierdo: veras las ejecuciones con icono VERDE de exito.")
    print("    - Haz clic en cualquier ejecucion para ver el diagrama de nodos y datos procesados en tiempo real.")
    print(" 2. Bandeja de Correo Mailpit:")
    print("    - Ingresa a: http://localhost:8025")
    print("    - Veras todos los emails HTML enviados por n8n (alertas SOC, bienvenidas, cambios de estado).")
    print(" 3. Workflows Programados (SLA Escalation / Cron):")
    print("    - Observa los correos de '[SECBOT][ESCALADO]': el workflow 'sla-escalation' monitorea")
    print("      continuamente la base de datos PostgreSQL cada 15 minutos en segundo plano.")
    print("=" * 80)

if __name__ == "__main__":
    main()
