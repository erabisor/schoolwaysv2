# ETAPA 1: Construcción
FROM node:18-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Validación obligatoria: si no llega la URL, el build falla
RUN echo "REACT_APP_API_URL=$REACT_APP_API_URL" && test -n "$REACT_APP_API_URL"

# Compilamos los archivos estáticos de producción
RUN npm run build

# Validación obligatoria: el build final debe contener la URL pública
RUN grep -R "https://api.schoolwaysv.online/api" /usr/src/app/build

# ETAPA 2: Servidor Web
FROM nginx:stable-alpine

COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]