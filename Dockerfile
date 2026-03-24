# ============================================================================
# Stage 1: Install all monorepo dependencies
# ============================================================================
FROM oven/bun:1.3.10-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/server/package.json ./packages/server/
COPY packages/result/package.json ./packages/result/

RUN bun install --frozen-lockfile


# ============================================================================
# Stage 2: Build the React/Vite frontend
# ============================================================================
FROM oven/bun:1.3.10-alpine AS frontend-builder
WORKDIR /app

# VITE_API_URL is baked into the JS bundle at build time.
# Default "" means same-origin — nginx proxies /api/* to Bun internally.
# Override with --build-arg VITE_API_URL=https://yourdomain.com if the API
# is served from a different origin.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

COPY package.json bun.lock tsconfig.json ./
COPY apps/frontend ./apps/frontend
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules

WORKDIR /app/apps/frontend
RUN bun run build


# ============================================================================
# Stage 3: Production image — Bun backend + nginx
# ============================================================================
FROM oven/bun:1.3.10-alpine AS runner
WORKDIR /app

# Install nginx (Alpine package)
RUN apk add --no-cache nginx && \
    # Remove default nginx site config
    rm -f /etc/nginx/http.d/default.conf

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

# Backend source
COPY package.json bun.lock tsconfig.json ./
COPY apps/backend ./apps/backend
COPY packages ./packages
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Frontend build → nginx document root
COPY --from=frontend-builder /app/apps/frontend/dist /usr/share/nginx/html

# nginx config: serves SPA, proxies /api/* to Bun
COPY nginx.prod.conf /etc/nginx/http.d/default.conf

# SQLite data directory (mount a volume here for persistence)
RUN mkdir -p /app/apps/backend/data

# Entrypoint: run migrations, start Bun in background, then nginx in foreground
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
