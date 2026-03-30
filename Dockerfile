FROM node:20-alpine AS base

# ── Dependencies ──────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Build ─────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy env để build không bị crash env validation
ENV LARK_APP_ID=build \
    LARK_APP_SECRET=build \
    LARK_APP_TOKEN=build \
    LARK_TABLE_PRODUCTS=build \
    LARK_TABLE_USERS=build \
    LARK_TABLE_ORDERS=build \
    LARK_TABLE_ORDER_ITEMS=build \
    NEXTAUTH_SECRET=build \
    NEXTAUTH_URL=http://localhost:3000

RUN npm run build

# ── Runner ────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
