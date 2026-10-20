FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
RUN npm prune --omit=dev

FROM node:24-slim
WORKDIR /app

ENV NODE_ENV=production
COPY package*.json ./
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/dist /app/dist
CMD ["npm", "run", "start:prod"]

