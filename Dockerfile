# syntax=docker/dockerfile:1
# Multi-stage build for Next.js — lean production image with BuildKit cache mounts.
# See: https://docs.docker.com/build/building/multi-stage/
# See: https://github.com/vercel/next.js/tree/canary/examples/with-docker

ARG NODE_VERSION=20

# -----------------------------------------------------------------------------
# Base: shared Node Alpine (small footprint)
# -----------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# -----------------------------------------------------------------------------
# Dependencies: install only when package manifests change (layer cache)
# -----------------------------------------------------------------------------
FROM base AS deps

COPY package.json package-lock.json ./
# BuildKit cache mount speeds rebuilds (DOCKER_BUILDKIT=1 / Compose v2 default)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# -----------------------------------------------------------------------------
# Builder: compile the Next.js app
# -----------------------------------------------------------------------------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# NEXT_PUBLIC_* must be set at build time (inlined into the client bundle)
ARG NEXT_PUBLIC_API_URL=https://api.faqhub.ir/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# -----------------------------------------------------------------------------
# Runner: production image with standalone server only
# -----------------------------------------------------------------------------
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3005
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Pre-create .next so the non-root user can write cache if needed
RUN mkdir .next && chown nextjs:nodejs .next

# Trace output from `output: "standalone"` — only runtime files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3005/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
