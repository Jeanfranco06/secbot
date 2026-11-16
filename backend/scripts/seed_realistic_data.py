"""Script de poblamiento de datos corporativos hiperrealistas para SecBot.
Crea usuarios reales, equipo corporativo, tickets, historiales de chat y logs de auditoría.
"""
import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy import text
from app.database import SessionLocal
from app import models
from app.auth import hash_password

DEFAULT_PASSWORD = "SecBot2026!"

def seed():
    db = SessionLocal()
    print("Iniciando poblamiento de datos corporativos realistas...")

    # 1. Configurar Roles y Permisos
    roles_def = {
        "admin": "Administrador del sistema",
        "security_analyst": "Analista de seguridad SOC",
        "compliance_officer": "Oficial de Cumplimiento y Auditoría",
        "employee": "Empleado usuario final",
    }
    roles_map = {}
    for r_name, r_desc in roles_def.items():
        role = db.query(models.Role).filter(models.Role.name == r_name).first()
        if not role:
            role = models.Role(name=r_name, description=r_desc)
            db.add(role)
            db.commit()
            db.refresh(role)
        roles_map[r_name] = role

    all_perms = {p.code: p.id for p in db.query(models.Permission).all()}

    # Permisos para compliance_officer
    comp_perms = ["dashboard.view", "report.export", "audit.view", "ticket.view_all", "chat.use", "chat.view_own"]
    for code in comp_perms:
        pid = all_perms.get(code)
        if pid:
            exists = db.query(models.RolePermission).filter_by(role_id=roles_map["compliance_officer"].id, permission_id=pid).first()
            if not exists:
                db.add(models.RolePermission(role_id=roles_map["compliance_officer"].id, permission_id=pid))
    db.commit()

    # 2. Usuarios Principales y Corporativos
    user_definitions = [
        # Usuarios reales proporcionados
        {
            "email": "jjgonzaleses@unitru.edu.pe",
            "full_name": "Jeanfranco Gonzales",
            "role": "admin",
            "jurisdiction": "LATAM-HQ"
        },
        {
            "email": "jean20francisco06@gmail.com",
            "full_name": "Jean Gonzales (Lead SOC Analyst)",
            "role": "security_analyst",
            "jurisdiction": "LATAM-HQ"
        },
        {
            "email": "jeff_20_06@hotmail.com",
            "full_name": "Jefferson Gonzales (Compliance Officer)",
            "role": "compliance_officer",
            "jurisdiction": "LATAM-HQ"
        },
        {
            "email": "201jean201@gmail.com",
            "full_name": "Jean Carlo Gonzales (DevSecOps Engineer)",
            "role": "employee",
            "jurisdiction": "LATAM-HQ"
        },
        # Equipo corporativo complementario
        {
            "email": "valentina.rodriguez@empresa.local",
            "full_name": "Valentina Rodríguez (Directora de Finanzas)",
            "role": "employee",
            "jurisdiction": "FIN-CORP"
        },
        {
            "email": "carlos.mendoza@empresa.local",
            "full_name": "Carlos Mendoza (Gerente de RRHH)",
            "role": "employee",
            "jurisdiction": "HR-CORP"
        },
        {
            "email": "marcos.vega@empresa.local",
            "full_name": "Marcos Vega (Tech Lead Backend)",
            "role": "employee",
            "jurisdiction": "ENG-CORP"
        },
        {
            "email": "elena.paredes@empresa.local",
            "full_name": "Elena Paredes (Líder de Operaciones)",
            "role": "employee",
            "jurisdiction": "OPS-CORP"
        },
        {
            "email": "diego.quispe@empresa.local",
            "full_name": "Diego Quispe (Ejecutivo de Cuentas)",
            "role": "employee",
            "jurisdiction": "SALES-CORP"
        },
        {
            "email": "patricia.alvarez@empresa.local",
            "full_name": "Dra. Patricia Álvarez (Asesora Legal & DPO)",
            "role": "employee",
            "jurisdiction": "LEGAL-CORP"
        },
        {
            "email": "raul.morales@empresa.local",
            "full_name": "Raúl Morales (Helpdesk N1)",
            "role": "employee",
            "jurisdiction": "IT-SUPPORT"
        },
        {
            "email": "sofia.castillo@empresa.local",
            "full_name": "Sofía Castillo (Analista SOC Junior)",
            "role": "security_analyst",
            "jurisdiction": "SOC-TI"
        }
    ]

    users_map = {}
    hashed_pwd = hash_password(DEFAULT_PASSWORD)

    for u_def in user_definitions:
        u = db.query(models.User).filter(models.User.email == u_def["email"]).first()
        if not u:
            u = models.User(
                email=u_def["email"],
                full_name=u_def["full_name"],
                password_hash=hashed_pwd,
                is_active=True,
                jurisdiction=u_def["jurisdiction"],
                created_at=datetime.utcnow() - timedelta(days=random.randint(60, 90)),
                last_login_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
            )
            db.add(u)
            db.commit()
            db.refresh(u)
        else:
            u.full_name = u_def["full_name"]
            u.password_hash = hashed_pwd
            u.is_active = True
            db.commit()

        # Asignar rol
        target_role = roles_map[u_def["role"]]
        has_role = db.query(models.UserRole).filter_by(user_id=u.id, role_id=target_role.id).first()
        if not has_role:
            db.add(models.UserRole(user_id=u.id, role_id=target_role.id))
            db.commit()

        users_map[u_def["email"]] = u
        print(f"Usuario verificado: {u.email} ({u_def['role']})")

    soc_lead = users_map["jean20francisco06@gmail.com"]
    soc_junior = users_map["sofia.castillo@empresa.local"]

    # 3. Documentos KB para citaciones
    kb_docs = {d.title: d for d in db.query(models.KbDocument).all()}

    # 4. Generar Historiales de Chat Realistas
    chat_scenarios = [
        {
            "user": "201jean201@gmail.com",
            "title": "¿Cuál es la política de complejidad y longitud de contraseñas?",
            "q": "¿Cuál es la política de complejidad y longitud de contraseñas?",
            "a": "De acuerdo con la **Política de Contraseñas v2.1 (§ 2)**, la longitud mínima obligatoria es de **12 caracteres** para cuentas estándar y **16 caracteres** para cuentas de administrador. Debe combinar mayúsculas, minúsculas, números y caracteres especiales, evitando patrones comunes o fechas.",
            "doc": "Política de Contraseñas",
            "section": "§ 2. Longitud y Complejidad",
            "days_ago": 35
        },
        {
            "user": "valentina.rodriguez@empresa.local",
            "title": "¿Puedo conectar una memoria USB personal en mi laptop?",
            "q": "¿Puedo conectar una memoria USB personal en mi laptop de finanzas para pasar unos reportes?",
            "a": "No. Según la **Política de Uso Aceptable v1.0 (§ 2)**, está terminantemente prohibido conectar memorias USB o medios extraíbles personales o no autorizados debido al riesgo de infección por malware y fuga de información sensible. Utilice el almacenamiento corporativo seguro OneDrive o SharePoint.",
            "doc": "Política de Uso Aceptable",
            "section": "§ 2. Uso de Medios Extraíbles y Memorias USB",
            "days_ago": 28
        },
        {
            "user": "marcos.vega@empresa.local",
            "title": "Procedimiento ante pérdida de equipo portátil corporativo",
            "q": "Dejé mi portátil en un taxi durante un viaje, ¿cuál es el runbook inmediato?",
            "a": "De acuerdo con el **Runbook de Pérdida de Portátil v1.0 (§ 1-3)**:\n1. Reporte el incidente de inmediato a `security@empresa.local` o abra un ticket de Severidad P2.\n2. Se activará el borrado remoto del disco cifrado vía Intune/MDM.\n3. Cambie sus credenciales de acceso corporativo desde un equipo seguro.\n4. Si el equipo contenía datos confidenciales, se notificará al Oficial de Privacidad.",
            "doc": "Runbook de Pérdida de Portátil",
            "section": "§ 1. Notificación y Aislamiento Remoto",
            "days_ago": 20
        },
        {
            "user": "carlos.mendoza@empresa.local",
            "title": "Sospecha de correo electrónico de Phishing",
            "q": "Recibí un correo sospechoso indicando que debo verificar mi clave en un portal externo urgentemente. ¿Cómo procedo?",
            "a": "Según el **Runbook de Respuesta ante Phishing v1.0 (§ 2)**, no haga clic en enlaces ni descargue archivos adjuntos. Reenvíe el correo con encabezados completos a `security@empresa.local` o utilice el botón de reporte en Outlook. Se ha generado una alerta preventiva para el equipo SOC.",
            "doc": "Runbook de Respuesta ante Phishing",
            "section": "§ 2. Identificación y Contención de Phishing",
            "days_ago": 15
        },
        {
            "user": "diego.quispe@empresa.local",
            "title": "Conexión a la VPN corporativa desde redes Wi-Fi públicas",
            "q": "¿Es obligatorio encender la VPN siempre que esté en un hotel o cafetería?",
            "a": "Sí. Según la **Política de Dispositivos Móviles v1.0 (§ 4)** y la **FAQ General (§ 3)**, toda conexión a recursos corporativos desde redes no confiables debe realizarse a través del túnel VPN con autenticación multifactor (MFA) obligatoria.",
            "doc": "Política de Dispositivos Móviles",
            "section": "§ 4. Redes Públicas y Conectividad Segura",
            "days_ago": 10
        },
        {
            "user": "patricia.alvarez@empresa.local",
            "title": "Uso de herramientas de Inteligencia Artificial públicas",
            "q": "¿Está permitido ingresar contratos o datos de clientes en ChatGPT u otras IAs públicas?",
            "a": "No. De acuerdo con la **Política de Uso Aceptable v1.0 (§ 5.3)**, está prohibido cargar código fuente, propiedad intelectual, contratos o datos de carácter personal en servicios de IA externos públicos sin aprobación explícita del CISO y DPO.",
            "doc": "Política de Uso Aceptable",
            "section": "§ 5.3. Servicios en la Nube e Inteligencia Artificial",
            "days_ago": 7
        },
        {
            "user": "raul.morales@empresa.local",
            "title": "Bloqueo de cuenta por múltiples intentos fallidos",
            "q": "¿Cuántos intentos fallidos bloquean una cuenta corporativa?",
            "a": "Según la **Política de Contraseñas v2.1 (§ 6)**, la cuenta se bloqueará automáticamente tras **5 intentos fallidos consecutivos** durante un periodo de 30 minutos, requiriendo desbloqueo por Helpdesk o validación MFA.",
            "doc": "Política de Contraseñas",
            "section": "§ 6. Caducidad, Bloqueo y Compromiso",
            "days_ago": 3
        }
    ]

    created_chats = []
    for sc in chat_scenarios:
        usr = users_map.get(sc["user"])
        if not usr:
            continue
        c_time = datetime.utcnow() - timedelta(days=sc["days_ago"], hours=random.randint(1, 10))
        chat = models.ChatHistory(
            id=uuid.uuid4(),
            user_id=usr.id,
            title=sc["title"],
            started_at=c_time,
            ended_at=c_time + timedelta(minutes=random.randint(3, 12))
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)
        created_chats.append(chat)

        # Mensaje de usuario
        u_msg = models.ChatMessage(
            chat_id=chat.id,
            role="user",
            content=sc["q"],
            created_at=c_time
        )
        db.add(u_msg)

        # Citas
        target_doc = kb_docs.get(sc["doc"])
        doc_id = str(target_doc.id) if target_doc else str(uuid.uuid4())
        citations = [{
            "document_id": doc_id,
            "title": sc["doc"],
            "version": "1.0",
            "section": sc["section"],
            "score": round(random.uniform(0.88, 0.96), 3)
        }]

        # Mensaje de asistente
        a_msg = models.ChatMessage(
            chat_id=chat.id,
            role="assistant",
            content=sc["a"],
            citations=citations,
            intent="knowledge_query",
            confidence=round(random.uniform(0.91, 0.98), 2),
            latency_ms=random.randint(850, 1950),
            tokens_in=random.randint(90, 180),
            tokens_out=random.randint(160, 320),
            created_at=c_time + timedelta(seconds=2)
        )
        db.add(a_msg)
        db.commit()

    print(f"Creados {len(created_chats)} historiales de chat estructurados con RAG y citas.")

    # 5. Generar Tickets Corporativos Realistas
    tickets_data = [
        # P1 - Críticos
        {
            "num": "TCK-20260912-000001",
            "title": "Alerta Crítica EDR: Ejecución de Cobalt Strike beacon en estación FIN-04",
            "desc": "El sensor EDR CrowdStrike detectó inyección de código en proceso spoolsv.exe originado desde la estación de trabajo FIN-04 en el segmento de Finanzas.",
            "cat": "malware",
            "sev": "P1",
            "status": "resuelto",
            "rep": "valentina.rodriguez@empresa.local",
            "asg": soc_lead.id,
            "days_ago": 39,
            "res": "Estación aislada inmediatamente de la red. Volcado de memoria forense obtenido. Se eliminó la persistencia en el registro y se revocaron credenciales del usuario. Análisis IoC distribuido al firewall.",
            "dur_hours": 1.2
        },
        {
            "num": "TCK-20260925-000002",
            "title": "Intento de compromiso de credenciales Domain Admin desde IP externa no autorizada",
            "desc": "El SIEM reportó 45 intentos de autenticación exitosos seguidos de anomalías de sesión para la cuenta de servicio svc_backup desde IP en ASN no corporativo.",
            "cat": "unauthorized_access",
            "sev": "P1",
            "status": "resuelto",
            "rep": "raul.morales@empresa.local",
            "asg": soc_lead.id,
            "days_ago": 26,
            "res": "Cuenta de servicio deshabilitada. Forzada revocación de tickets Kerberos en todos los controladores de dominio. IP atacante añadida a lista negra perimetral. Causa raíz: credencial expuesta en script interno.",
            "dur_hours": 0.8
        },
        {
            "num": "TCK-20261018-000003",
            "title": "Detección de artefactos sospechosos de Ransomware en servidor de archivos DFS-02",
            "desc": "Múltiples archivos renombrados con extensión .lockbit detectados en carpeta compartida de Operaciones. Tasa inusual de operaciones de escritura por segundo.",
            "cat": "malware",
            "sev": "P1",
            "status": "en_progreso",
            "rep": "elena.paredes@empresa.local",
            "asg": soc_lead.id,
            "days_ago": 2,
            "res": None,
            "dur_hours": None
        },

        # P2 - Altos
        {
            "num": "TCK-20260918-000004",
            "title": "Campaña de Phishing masivo suplantando al portal de nóminas de RRHH",
            "desc": "Más de 40 colaboradores recibieron correo con asunto 'Actualización urgente de cuenta bancaria para pago de haberes' apuntando a dominio fraudulento `rrhh-nomina.tk`.",
            "cat": "phishing",
            "sev": "P2",
            "status": "resuelto",
            "rep": "carlos.mendoza@empresa.local",
            "asg": soc_lead.id,
            "days_ago": 33,
            "res": "Dominio bloqueado en DNS perimetral y puerta de enlace de correo. Purga automática de 38 correos no abiertos. Dos usuarios que ingresaron datos fueron guiados en cambio de clave inmediato.",
            "dur_hours": 2.5
        },
        {
            "num": "TCK-20261002-000005",
            "title": "Pérdida de portátil corporativo Dell Latitude en transporte público",
            "desc": "El empleado Marcos Vega reportó olvido de su equipo portátil corporativo en un taxi. El equipo contiene repositorios y código de desarrollo.",
            "cat": "lost_device",
            "sev": "P2",
            "status": "resuelto",
            "rep": "marcos.vega@empresa.local",
            "asg": soc_junior.id,
            "days_ago": 19,
            "res": "BitLocker validado como activo con cifrado XTS-AES 256. Comando de borrado remoto (Wipe) ejecutado desde Microsoft Intune. Sesiones SSO y tokens OAuth revocados en Azure AD.",
            "dur_hours": 1.5
        },
        {
            "num": "TCK-20261008-000006",
            "title": "Fuga accidental de API Key de infraestructura en commit de GitHub público",
            "desc": "Un escaneo de secretos de GitGuardian detectó una clave de acceso a bucket S3 en un repositorio público personal de un colaborador.",
            "cat": "policy_violation",
            "sev": "P2",
            "status": "resuelto",
            "rep": "201jean201@gmail.com",
            "asg": soc_lead.id,
            "days_ago": 13,
            "res": "Clave IAM revocada de inmediato en AWS. Auditoría de logs en CloudTrail no detectó descargas anómalas. Se realizó commit de sanitización y capacitación al desarrollador.",
            "dur_hours": 3.0
        },
        {
            "num": "TCK-20261019-000007",
            "title": "Detección de malware Infostealer (RedLine) en laptop de desarrollo",
            "desc": "Windows Defender detectó binario sospechoso descargado como falso instalador de cliente de base de datos.",
            "cat": "malware",
            "sev": "P2",
            "status": "en_progreso",
            "rep": "marcos.vega@empresa.local",
            "asg": soc_lead.id,
            "days_ago": 1,
            "res": None,
            "dur_hours": None
        },

        # P3 - Medios
        {
            "num": "TCK-20260920-000008",
            "title": "Conexión de memoria USB no autorizada bloqueada por política en WORKSTATION-402",
            "desc": "El agente de seguridad bloqueó la inserción de un dispositivo USB Kingston no homologado en la estación del departamento de Ventas.",
            "cat": "policy_violation",
            "sev": "P3",
            "status": "resuelto",
            "rep": "diego.quispe@empresa.local",
            "asg": soc_junior.id,
            "days_ago": 31,
            "res": "Se confirmó que el usuario intentaba copiar un catálogo de marketing. Se le recordó la política y se habilitó carpeta compartida en OneDrive.",
            "dur_hours": 6.0
        },
        {
            "num": "TCK-20260929-000009",
            "title": "Múltiples intentos fallidos de autenticación VPN desde geolocalización inusual",
            "desc": "Firewall perimetral registró 120 intentos de conexión VPN fallidos con cuentas de empleados activos desde rangos de red en Europa del Este.",
            "cat": "unauthorized_access",
            "sev": "P3",
            "status": "resuelto",
            "rep": "raul.morales@empresa.local",
            "asg": soc_junior.id,
            "days_ago": 22,
            "res": "Bloqueo por geofencing implementado en portal VPN. Reglas de rate-limit reforzadas. Ninguna cuenta fue vulnerada.",
            "dur_hours": 8.0
        },
        {
            "num": "TCK-20261012-000010",
            "title": "Certificado SSL/TLS próximo a expirar en portal secundario de clientes",
            "desc": "El escaneo automatizado de certificados alertó expiración en 7 días para el subdominio `portal-socios.empresa.local`.",
            "cat": "policy_violation",
            "sev": "P3",
            "status": "resuelto",
            "rep": "201jean201@gmail.com",
            "asg": soc_junior.id,
            "days_ago": 9,
            "res": "Certificado renovado y desplegado mediante script de automatización Caddy / Let's Encrypt. Pruebas de handshake TLS 1.3 satisfactorias.",
            "dur_hours": 4.0
        },
        {
            "num": "TCK-20261020-000011",
            "title": "Reporte de llamada telefónica sospechosa solicitando verificación de clave (Vishing)",
            "desc": "Colaboradora de Finanzas reportó llamada de sujeto haciéndose pasar por soporte técnico de Microsoft solicitando código de verificación MFA.",
            "cat": "phishing",
            "sev": "P3",
            "status": "nuevo",
            "rep": "valentina.rodriguez@empresa.local",
            "asg": None,
            "days_ago": 1,
            "res": None,
            "dur_hours": None
        },

        # P4 - Bajos
        {
            "num": "TCK-20260915-000012",
            "title": "Solicitud de excepción de política para software estadístico RStudio",
            "desc": "Analista de datos solicita instalación de paquete CRAN no estándar para análisis cuantitativo.",
            "cat": "policy_violation",
            "sev": "P4",
            "status": "resuelto",
            "rep": "elena.paredes@empresa.local",
            "asg": soc_junior.id,
            "days_ago": 36,
            "res": "Análisis de dependencias y hash SHA256 completado sin vulnerabilidades conocidas. Software aprobado y firmado en catálogo interno.",
            "dur_hours": 24.0
        },
        {
            "num": "TCK-20261015-000013",
            "title": "Consulta sobre configuración de registros DKIM/DMARC en nuevo subdominio de marketing",
            "desc": "Equipo de comunicaciones solicita validación de políticas de autenticación de correo para envíos masivos.",
            "cat": "policy_violation",
            "sev": "P4",
            "status": "resuelto",
            "rep": "carlos.mendoza@empresa.local",
            "asg": soc_junior.id,
            "days_ago": 6,
            "res": "Políticas SPF (v=spf1), DKIM (2048-bit) y DMARC (p=quarantine) configuradas y verificadas en DNS institucional.",
            "dur_hours": 18.0
        },
        {
            "num": "TCK-20261021-000014",
            "title": "Solicitud de revisión de permisos de acceso en carpeta compartida de Legal",
            "desc": "Revisión periódica trimestral de control de accesos para cumplimiento de normativa de confidencialidad.",
            "cat": "policy_violation",
            "sev": "P4",
            "status": "nuevo",
            "rep": "patricia.alvarez@empresa.local",
            "asg": None,
            "days_ago": 0,
            "res": None,
            "dur_hours": None
        }
    ]

    for t_data in tickets_data:
        existing = db.query(models.Ticket).filter(models.Ticket.ticket_number == t_data["num"]).first()
        created_dt = datetime.utcnow() - timedelta(days=t_data["days_ago"], hours=random.randint(1, 12))
        sla_hours = {"P1": 1, "P2": 4, "P3": 24, "P4": 72}[t_data["sev"]]
        due_dt = created_dt + timedelta(hours=sla_hours)
        res_dt = created_dt + timedelta(hours=t_data["dur_hours"]) if t_data["dur_hours"] else None

        rep_user = users_map.get(t_data["rep"])
        rep_id = rep_user.id if rep_user else users_map["jjgonzaleses@unitru.edu.pe"].id

        if not existing:
            t = models.Ticket(
                id=uuid.uuid4(),
                ticket_number=t_data["num"],
                title=t_data["title"],
                description=t_data["desc"],
                category=t_data["cat"],
                severity=t_data["sev"],
                status=t_data["status"],
                source="chat_assistant" if random.random() > 0.4 else "manual",
                reported_by=rep_id,
                assigned_to=t_data["asg"],
                due_at=due_dt,
                resolved_at=res_dt,
                resolution=t_data["res"],
                metadata_={
                    "notified": True,
                    "notified_at": created_dt.isoformat(),
                    "source_channel": "SecBot AI Platform"
                },
                created_at=created_dt,
                updated_at=res_dt or created_dt
            )
            db.add(t)
        else:
            existing.title = t_data["title"]
            existing.description = t_data["desc"]
            existing.status = t_data["status"]
            existing.severity = t_data["sev"]
            existing.reported_by = rep_id
            existing.assigned_to = t_data["asg"]
            existing.resolution = t_data["res"]
            existing.resolved_at = res_dt
    db.commit()
    print(f"Poblados {len(tickets_data)} tickets de ciberseguridad con ciclo de vida completo.")

    # 6. Generar Entradas de Auditoría Realistas (Últimos 60 días)
    audit_events = []
    actions = [
        ("auth", "login", "user", "ok"),
        ("auth", "login", "user", "ok"),
        ("auth", "login", "user", "fail"),
        ("chat", "query", "knowledge_base", "ok"),
        ("chat", "query", "knowledge_base", "ok"),
        ("tickets", "status_change", "ticket", "ok"),
        ("tickets", "assigned", "ticket", "ok"),
        ("reports", "export", "report_pdf", "ok"),
        ("compliance", "evidence_view", "iso_27001", "ok"),
        ("kb", "document_access", "policy", "ok")
    ]

    all_user_ids = [u.id for u in users_map.values()]

    for d in range(60, -1, -1):
        num_events = random.randint(3, 8)
        for _ in range(num_events):
            mod, act, ent, res = random.choice(actions)
            uid = random.choice(all_user_ids)
            event_time = datetime.utcnow() - timedelta(days=d, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            al = models.AuditLog(
                user_id=uid if act != "login" or res == "ok" else None,
                module=mod,
                action=act,
                entity=ent,
                entity_id=str(uuid.uuid4())[:8],
                ip=f"192.168.10.{random.randint(20, 250)}",
                user_agent="SecBot Client 3.0 / Chrome 129",
                result=res,
                input={"details": f"Evento corporativo registrado: {act} en módulo {mod}"},
                created_at=event_time
            )
            audit_events.append(al)

    db.bulk_save_objects(audit_events)
    db.commit()
    print(f"Poblados {len(audit_events)} eventos de auditoría histórica para gráficas y métricas.")

    print("\n✓ Poblamiento finalizado con éxito:")
    print("  - Administrador CISO: jjgonzaleses@unitru.edu.pe")
    print("  - Lead SOC Analyst:   jean20francisco06@gmail.com")
    print("  - Compliance Officer: jeff_20_06@hotmail.com")
    print("  - DevSecOps Engineer: 201jean201@gmail.com")
    print(f"  - Contraseña general: {DEFAULT_PASSWORD}")
    db.close()

if __name__ == "__main__":
    seed()
