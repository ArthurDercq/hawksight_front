# Frontend HawkSight — image de PROD (build Vite → servi par nginx)
# Multi-stage : on build avec Node, on ne garde que le statique dans nginx.

# ---------- Stage 1 : build ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Variables VITE_* injectées AU BUILD (elles sont "gravées" dans le bundle).
# Valeurs passées via `args:` dans compose.prod.yaml.
ARG VITE_API_BASE_URL=/api
ARG VITE_MAPBOX_ACCESS_TOKEN=""
ARG VITE_SENTRY_DSN=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_MAPBOX_ACCESS_TOKEN=$VITE_MAPBOX_ACCESS_TOKEN \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN

RUN npm run build

# ---------- Stage 2 : serve ----------
FROM nginx:alpine

# SPA fallback + proxy /api/ -> backend:8000 (défini dans nginx.prod.conf)
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
