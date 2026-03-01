FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# puerto del backend
EXPOSE 5000

# comando de arranque
CMD ["node", "server.js"]