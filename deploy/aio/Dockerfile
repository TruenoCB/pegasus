# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ ./
RUN yarn build

# Stage 2: Build Backend
FROM golang:1.21-alpine AS backend-builder
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN go build -o api cmd/api/main.go

# Stage 3: Final Image (All-in-One)
FROM alpine:3.19

# Install dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    ca-certificates \
    tzdata \
    curl

# Setup directories
WORKDIR /app
RUN mkdir -p /var/log/supervisor /run/nginx /usr/share/nginx/html

# Copy Frontend assets
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy Backend binary
COPY --from=backend-builder /app/api /app/api

# Copy Configs
COPY deploy/aio/nginx.conf /etc/nginx/http.d/default.conf
COPY deploy/aio/supervisord.conf /etc/supervisord.conf

# Expose ports
EXPOSE 80 8080

# Start Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
