#!/bin/bash
echo "🔄 1. Descargando últimos cambios de GitHub..."
git pull

echo "🛑 2. Apagando contenedores antiguos..."
docker compose down

echo "🚀 3. Reconstruyendo y levantando producción..."
docker compose up -d --build

echo "✅ ¡Actualización de SchoolWaySV completada con éxito!"