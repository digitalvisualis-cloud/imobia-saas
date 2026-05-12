# syntax=docker/dockerfile:1.7

# ─── DEPS ────────────────────────────────────────────────────────────
# Instala dependencias separado pra cache do Docker layer
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ─── BUILDER ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Gera Prisma Client (usa o schema copiado acima)
RUN npx prisma generate

# Disable telemetry no build
ENV NEXT_TELEMETRY_DISABLED=1

# Build do Next.js (gera .next/standalone com output: standalone)
RUN npm run build

# ─── RUNNER ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl tzdata && \
    cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime && \
    echo "America/Sao_Paulo" > /etc/timezone

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV TZ=America/Sao_Paulo

# Cria user nao-root pra rodar a app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Public assets (next/image, fontes, etc)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Standalone build (server.js + node_modules minimal)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma Client + engine binarios precisam estar acessiveis em runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

# Standalone server entry
CMD ["node", "server.js"]
