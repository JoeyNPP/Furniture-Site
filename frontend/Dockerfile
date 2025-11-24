FROM node:20-bullseye AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Run react-scripts directly via node to avoid symlink issues
RUN node node_modules/react-scripts/bin/react-scripts.js build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
