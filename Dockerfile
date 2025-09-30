# npp_deals-db
FROM postgres:13-alpine
ENV POSTGRES_DB=npp_deals
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=26,Sheetpans!
EXPOSE 5432
CMD ["postgres"]

# npp_deals-backend
FROM python:3.8-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
FROM python:3.8-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.8/site-packages /usr/local/lib/python3.8/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EXPOSE 8000

# npp_deals-frontend
FROM node:20 AS builder
ARG REACT_APP_FRONTEND_URL
ENV REACT_APP_FRONTEND_URL=$REACT_APP_FRONTEND_URL
ENV NODE_OPTIONS="--max-old-space-size=4096 --openssl-legacy-provider"
WORKDIR /app
RUN apt-get update && apt-get install -y npm
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
