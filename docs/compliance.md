# Mapeo de controles — SecBot

> **Aviso:** Este mapeo es orientativo y no constituye certificación, auditoría ni declaración de cumplimiento legal. La aplicabilidad depende del alcance del SGSI, del contexto regulatorio y de la jurisdicción.

## ISO/IEC 27001:2022 — Anexo A

| Control | Nombre | Cómo lo cubre SecBot |
|---|---|---|
| A.5.1 | Políticas de seguridad de la información | KB centraliza políticas; RAG responde con citas |
| A.5.15 | Control de acceso | RBAC con permisos finos; JWT; rate limiting |
| A.5.16 | Gestión de identidades | `users`, `roles`, `user_roles`; altas/bajas auditadas |
| A.5.17 | Información de autenticación | bcrypt; reset con revocación de sesiones |
| A.5.18 | Derechos de acceso | Revisión trimestral; rol `admin` limitado |
| A.5.24 | Planificación y preparación de la gestión de incidentes | Clasificador + ticket + notificación |
| A.5.25 | Evaluación de eventos de seguridad | Clasificación híbrida reglas + LLM |
| A.5.26 | Respuesta a incidentes | SLAs por severidad; workflow n8n |
| A.5.27 | Aprendizaje de incidentes | Dashboard de tendencias; feedback |
| A.5.28 | Recolección de evidencia | `audit_log` append-only; retención 5 años |
| A.5.34 | Privacidad y protección de PII | Redacción PII antes de persistir; retención |
| A.5.36 | Cumplimiento de políticas | Auditoría; reportes de cumplimiento |
| A.8.2 | Privilegios de acceso privilegiado | Rol `admin` separado; auditoría de cambios |
| A.8.5 | Autenticación segura | JWT + refresh rotativo; revocación |
| A.8.6 | Gestión de capacidad | Métricas Prometheus; pruebas de carga |
| A.8.7 | Protección contra malware | KB de concientización; clasificador de phishing |
| A.8.8 | Gestión de vulnerabilidades técnicas | Fuera de alcance SecBot (se integra al pipeline global) |
| A.8.9 | Gestión de configuración | Docker Compose; variables de entorno; migraciones |
| A.8.12 | Prevención de fuga de datos | RBAC; redacción PII; TLS; cifrado en reposo |
| A.8.13 | Copia de seguridad | Backups diarios; retención 30 días; S3 opcional |
| A.8.14 | Redundancia | Opcional multi-AZ en Fase 3 |
| A.8.15 | Registro | `audit_log`; logs centralizados Loki |
| A.8.16 | Actividades de seguimiento | Prometheus + Grafana; alertas |
| A.8.20 | Seguridad en redes | TLS 1.3; Caddy; segmentación por red Docker |
| A.8.21 | Seguridad de servicios de red | Rate limiting; validación de inputs |
| A.8.24 | Uso de criptografía | TLS; bcrypt; JWT HS256 (recomendado RS256 en Fase 3) |
| A.8.25 | Ciclo de vida de desarrollo seguro | Tests; migraciones; revisión de PRs |
| A.8.28 | Codificación segura | Sanitización; Pydantic; OWASP Top 10 |
| A.8.32 | Gestión de cambios | Alembic; versionado; PRs |

## NIST CSF 2.0 — Funciones

| Función | Categoría | Subcategoría | Cobertura SecBot |
|---|---|---|---|
| GV | GV.OC-01 | Contexto organizacional | KB de políticas |
| GV | GV.RM-01 | Gestión de riesgos | Dashboards; reportes |
| GV | GV.RR-02 | Roles y responsabilidades | RBAC; matriz de permisos |
| GV | GV.PO-01 | Políticas | KB versionada |
| ID | ID.AM-01 | Inventario de activos | `kb_documents`; `users` |
| ID | ID.RA-05 | Evaluación de riesgos | Clasificación de incidentes |
| ID | ID.IM-02 | Mejora continua | Feedback; retención |
| PR | PR.AA-01 | Identidades y credenciales | Auth local; SSO preparado |
| PR | PR.AA-03 | Autenticación | JWT; refresh rotativo |
| PR | PR.AA-05 | Control de acceso | RBAC con permisos |
| PR | PR.AT-01 | Concientización | FAQ; RAG |
| PR | PR.DS-01 | Protección de datos | TLS; redacción PII |
| PR | PR.DS-02 | Integridad de datos | Auditoría append-only |
| PR | PR.PS-01 | Configuración segura | Docker Compose; env vars |
| DE | DE.AE-02 | Análisis de eventos | Clasificador |
| DE | DE.AE-03 | Correlación | Métricas por tema |
| DE | DE.CM-01 | Monitoreo de redes | Prometheus; Loki |
| DE | DE.CM-09 | Monitoreo de cómputo | Métricas backend |
| RS | RS.MA-01 | Gestión de incidentes | Tickets + SLAs |
| RS | RS.MA-02 | Análisis | Clasificación |
| RS | RS.AN-03 | Análisis de evidencia | Auditoría |
| RS | RS.CO-02 | Comunicación | Notificaciones n8n |
| RC | RC.RP-01 | Plan de recuperación | Runbook DR |
| RC | RC.RP-02 | Restauración | `restore_full.sh` |
| RC | RC.CO-03 | Comunicación de recuperación | Notificación post-DR |

## Evidencia para auditoría

- Logs de auditoría exportables (Excel) desde `/api/v1/admin/audit`.
- Backups verificables con `sha256sum`.
- Reportes de gestión exportables.
- Runbook DR firmado.
- Registro de pruebas de restauración trimestrales.