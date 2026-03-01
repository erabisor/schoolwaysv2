FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# puerto de React
EXPOSE 3000

CMD ["npm", "start"]