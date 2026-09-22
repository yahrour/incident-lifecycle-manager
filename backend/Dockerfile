FROM node:24-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy schema first so `prisma generate` stays cached across source changes
COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Deps: production dependencies only ----
FROM node:24-slim AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ---- Runner: minimal runtime image ----
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node prisma.config.ts ./

USER node
EXPOSE 3000

CMD ["node", "dist/src/main"]
