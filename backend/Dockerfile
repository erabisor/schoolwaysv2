FROM node:18-alpine

# Declaramos el entorno de producción
ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./
# Instalamos solo las dependencias estrictamente necesarias para producción
RUN npm install --only=production

COPY . .

# puerto del backend
EXPOSE 5000

# comando de arranque
CMD ["node", "server.js"]