FROM node:20-bullseye AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
# Permanent fix for npm 10.8+ broken symlink bug
RUN cd node_modules/.bin && rm -f react-scripts && ln -s ../react-scripts/bin/react-scripts.js react-scripts
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
