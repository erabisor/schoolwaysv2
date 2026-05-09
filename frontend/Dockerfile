# ETAPA 1: Build
FROM node:18-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# ===== VARIABLES DE BUILD (OBLIGATORIAS) =====
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Validación: si no llega la variable, el build debe fallar
RUN echo "REACT_APP_API_URL=$REACT_APP_API_URL" && test -n "$REACT_APP_API_URL"

# Build de React
RUN npm run build

# Validación: el build DEBE contener la URL pública
RUN grep -R "https://api.schoolwaysv.online/api" /usr/src/app/build

# ETAPA 2: Nginx
FROM nginx:stable-alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]