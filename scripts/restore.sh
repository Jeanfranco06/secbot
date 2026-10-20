#!/usr/bin/env bash
set -euo pipefail
FILE="$1"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Uso: $0 <backup.sql.gz>"
  exit 1
fi
gunzip -c "$FILE" | docker compose exec -T postgres psql \
  -U "${POSTGRES_USER:-secbot}" -d "${POSTGRES_DB:-secbot}"
echo ">> Restauración completa"