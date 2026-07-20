# Development stage
FROM node:22-alpine AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci

# Build stage
FROM node:22-alpine AS build
WORKDIR /usr/src/app
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Production stage
FROM node:22-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/dist ./dist
COPY --from=build --chown=node:node /usr/src/app/package*.json ./
USER node
EXPOSE 3005
CMD ["node", "dist/src/main.js"]
