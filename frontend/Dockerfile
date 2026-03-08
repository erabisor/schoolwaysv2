# ETAPA 1: Construcción
FROM node:18-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
# Compilamos los archivos estáticos de producción
RUN npm run build

# ETAPA 2: Servidor Web
FROM nginx:stable-alpine
# Copiamos lo compilado en la etapa 1
COPY --from=build /usr/src/app/build /usr/share/nginx/html
# Copiamos el archivo de configuración que creamos en el paso 1
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Puerto de Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]