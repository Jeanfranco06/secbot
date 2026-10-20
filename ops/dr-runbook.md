# Runbook DR — SecBot

## RTO / RPO objetivos
- **RTO (tiempo de recuperación):** 4 horas.
- **RPO (pérdida máxima de datos):** 24 horas (backup diario).

## Escenarios

### 1. Caída de PostgreSQL
1. `docker compose ps postgres`
2. Si no arranca: revisar logs `docker compose logs postgres`.
3. Restaurar desde backup más reciente: `./scripts/restore_full.sh /var/backups/secbot/<stamp>`.
4. Verificar `SELECT COUNT(*) FROM users;` y `/health`.

### 2. Caída de Ollama
1. `docker compose restart ollama`
2. Verificar modelo: `docker compose exec ollama ollama list`
3. Si falta modelo: `docker compose exec ollama ollama pull llama3.2:3b-instruct-q4_K_M`
4. Fallback temporal: activar `LLM_FALLBACK=azure` en `.env`.

### 3. Caída de n8n
1. `docker compose restart n8n`
2. Los tickets se siguen creando en PostgreSQL (FastAPI persiste antes de notificar).
3. Notificaciones se reintentan manualmente con `scripts/replay_notifications.py`.

### 4. Pérdida total del host
1. Provisionar nueva VM con Docker.
2. `git clone` del repositorio.
3. Restaurar `.env` desde backup seguro (gestor de secretos).
4. `./scripts/restore_full.sh /var/backups/secbot/<stamp>` (o desde S3).
5. `docker compose up -d`.
6. Verificar Caddy emite certificados TLS.
7. Smoke test: login, chat, ticket, dashboard.

## Pruebas de restauración
- Trimestral: restaurar en entorno staging y validar.
- Documentar fecha, responsable, resultado.

## Contactos
- Responsable infraestructura: ______
- Responsable seguridad: ______
- Escalamiento: ______