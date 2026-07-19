# Development stage
FROM node:22-alpine AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci

# Build stage
FROM node:22-alpine AS build
WORKDIR /usr/src/app
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY . .
ENV NODE_ENV=production
RUN npm run build
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:22-alpine AS production
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./
USER node
EXPOSE 3005
CMD ["node", "dist/src/main.js"]
