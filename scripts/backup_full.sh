#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/secbot}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"
STAMP=$(date -u +%Y%m%d_%H%M%S)
DIR="$BACKUP_DIR/$STAMP"
mkdir -p "$DIR"

echo ">> Backup PostgreSQL"
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-secbot}" \
  -d "${POSTGRES_DB:-secbot}" --no-owner --clean --if-exists \
  | gzip > "$DIR/db.sql.gz"

echo ">> Backup volúmenes (n8n, ollama config, Caddy)"
docker run --rm \
  -v secbot_n8ndata:/data \
  -v "$DIR":/backup \
  alpine tar czf /backup/n8n.tar.gz -C /data .

docker run --rm \
  -v secbot_caddy_data:/data \
  -v "$DIR":/backup \
  alpine tar czf /backup/caddy.tar.gz -C /data .

echo ">> Backup .env y compose"
cp .env "$DIR/.env.bak"
cp docker-compose.yml "$DIR/docker-compose.yml.bak"

echo ">> Checksums"
(cd "$DIR" && sha256sum * > SHA256SUMS)

echo ">> Subida a S3 (si configurado)"
if [ -n "$S3_BUCKET" ]; then
  aws s3 cp "$DIR" "s3://$S3_BUCKET/secbot/$STAMP/" --recursive
fi

echo ">> Retención local"
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime "+$RETENTION_DAYS" -exec rm -rf {} +

echo ">> Verificación"
gunzip -t "$DIR/db.sql.gz" && echo "OK"

echo ">> Backup completo: $DIR"