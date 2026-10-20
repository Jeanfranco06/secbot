#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/secbot_${STAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres pg_dump \
  -U "${POSTGRES_USER:-secbot}" \
  -d "${POSTGRES_DB:-secbot}" \
  --no-owner --clean --if-exists \
  | gzip > "$FILE"

echo ">> Backup: $FILE ($(du -h "$FILE" | cut -f1))"

# Borrar backups más antiguos que RETENTION_DAYS
find "$BACKUP_DIR" -name "secbot_*.sql.gz" -mtime "+$RETENTION_DAYS" -delete

# Verificación
gunzip -t "$FILE" && echo ">> Verificación OK"