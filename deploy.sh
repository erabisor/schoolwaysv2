#!/bin/bash
set -e

echo "🔄 1. Sincronizando código con GitHub..."
git fetch --all
git reset --hard origin/main

echo "📂 2. Preparando variables de entorno..."
cp .env ./frontend/.env
cp .env ./backend/.env

echo "🛑 3. Apagando contenedores antiguos..."
docker compose down

echo "🚀 4. Reconstruyendo y levantando producción..."
docker compose up -d --build

echo "✅ ¡Actualización completada!"