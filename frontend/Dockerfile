RUN cd node_modules/.bin && rm -f react-scripts && ln -s ../react-scripts/bin/react-scripts.js react-scripts 
FROM node:20 AS builder
ARG REACT_APP_FRONTEND_URL
ENV REACT_APP_FRONTEND_URL=$REACT_APP_FRONTEND_URL
ENV NODE_OPTIONS="--max-old-space-size=4096 --openssl-legacy-provider"
WORKDIR /app
RUN npm install -g npm@11.6.1
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps
RUN npx update-browserslist-db@latest --update-db || true
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
