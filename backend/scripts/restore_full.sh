#!/usr/bin/env bash
set -euo pipefail
SRC="$1"
if [ -z "$SRC" ] || [ ! -d "$SRC" ]; then
  echo "Uso: $0 <directorio_backup>"
  exit 1
fi

echo ">> Verificando checksums"
(cd "$SRC" && sha256sum -c SHA256SUMS)

echo ">> Restaurando PostgreSQL"
gunzip -c "$SRC/db.sql.gz" | docker compose exec -T postgres \
  psql -U "${POSTGRES_USER:-secbot}" -d "${POSTGRES_DB:-secbot}"

echo ">> Restaurando n8n"
docker run --rm -v secbot_n8ndata:/data -v "$SRC":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/n8n.tar.gz -C /data"

echo ">> Restaurando Caddy"
docker run --rm -v secbot_caddy_data:/data -v "$SRC":/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/caddy.tar.gz -C /data"

echo ">> Restaurando .env (revisa antes de sobrescribir)"
echo "   cp $SRC/.env.bak .env"

echo ">> Reiniciando servicios"
docker compose up -d

echo ">> Restauración completa"