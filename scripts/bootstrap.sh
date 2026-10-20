#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  cp .env.example .env
  echo ">> Editado .env generado. Cambia secretos antes de continuar."
fi

docker compose up -d postgres ollama n8n
echo ">> Esperando PostgreSQL..."
until docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; do
  sleep 2
done

echo ">> Descargando modelos en Ollama..."
docker compose exec -T ollama ollama pull "${LLM_MODEL:-llama3.2:3b-instruct-q4_K_M}"

echo ">> Levantando backend y frontend..."
docker compose up -d backend frontend

echo ">> Bootstrap completo. Accede a http://localhost:3000"
echo ">> n8n: http://localhost:5678"