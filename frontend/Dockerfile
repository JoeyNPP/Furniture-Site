# syntax=docker/dockerfile:1
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npm install react-scripts --save
COPY . .
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]