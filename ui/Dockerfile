# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production image (Nginx) ─────────────────────────────────────────
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled Vite output from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Install curl for the health check (not included in nginx:alpine by default)
RUN apk add --no-cache curl

# Health check — verifies Nginx is responding
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fs http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
