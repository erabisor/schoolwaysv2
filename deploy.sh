#!/bin/bash
# Detener el script si algo falla
set -e

echo "🔄 1. Sincronizando código con GitHub (Forzado)..."
git fetch --all
git reset --hard origin/main

echo "📂 2. Preparando variables de entorno para el Build de React..."
# Lo copiamos ANTES de construir para que React lo vea
cp .env ./frontend/

echo "🛑 3. Limpiando contenedores antiguos..."
docker compose down

echo "🚀 4. Reconstruyendo imágenes y levantando producción..."
# Aquí es donde React "suelda" la URL de la API en el código
docker compose up -d --build

echo "✅ ¡Actualización de SchoolWaySV completada con éxito!"