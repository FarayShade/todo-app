FROM node:26-alpine
FROM postgres:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . ./

CMD npm start