# EstateEdge — Multi-stage Dockerfile
# Used for all backend services: gateway, site-service, ai-service, user-service, analytics-service
#
# Build with:
#   docker build --build-arg SERVICE=ai-service -t estateedge/ai-service:latest .
#
# The SERVICE arg controls which service is built

ARG SERVICE=gateway
ARG NODE_VERSION=20

# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy root workspace files
COPY package.json pnpm-workspace.yaml ./

# Copy service-specific package.json
ARG SERVICE
COPY backend/shared/package.json ./backend/shared/
COPY backend/${SERVICE}/package.json ./backend/${SERVICE}/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Builder ─────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/shared/node_modules ./backend/shared/node_modules
ARG SERVICE
COPY --from=deps /app/backend/${SERVICE}/node_modules ./backend/${SERVICE}/node_modules

# Copy source
COPY tsconfig.json ./
COPY backend/shared ./backend/shared
COPY backend/${SERVICE} ./backend/${SERVICE}

# Build TypeScript
RUN pnpm --filter ${SERVICE} build

# ─── Stage 3: Runner ──────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 estateedge && \
    chown -R estateedge:nodejs /app

ARG SERVICE
ENV SERVICE_NAME=${SERVICE}

# Copy built artifacts
COPY --from=builder --chown=estateedge:nodejs /app/backend/${SERVICE}/dist ./dist
COPY --from=builder --chown=estateedge:nodejs /app/backend/shared/dist ./shared/dist
COPY --from=builder --chown=estateedge:nodejs /app/backend/${SERVICE}/package.json ./

# Install only production deps
RUN npm install --omit=dev

USER estateedge

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:${PORT:-4000}/health || exit 1

CMD ["node", "dist/index.js"]