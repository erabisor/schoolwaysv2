#!/bin/bash
# Detener el script inmediatamente si un comando falla
set -e

echo "🔄 1. Sincronizando código con GitHub (FORZADO)..."
git fetch --all
# Esto borra cualquier cambio local en scripts y archivos para igualar a GitHub
git reset --hard origin/main

echo "📂 2. Preparando variables de entorno..."
# Copiamos el .env a la carpeta frontend ANTES del build
cp .env ./frontend/

echo "🛑 3. Apagando contenedores antiguos..."
docker compose down

echo "🚀 4. Reconstruyendo y levantando producción..."
# Forzamos la reconstrucción para que React 'suelde' las variables del .env
docker compose up -d --build

echo "✅ ¡Actualización de SchoolWaySV completada REALMENTE con éxito!"