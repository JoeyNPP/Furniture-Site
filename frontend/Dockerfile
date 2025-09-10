FROM node:20 AS builder
ARG REACT_APP_FRONTEND_URL
ENV REACT_APP_FRONTEND_URL=$REACT_APP_FRONTEND_URL
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]