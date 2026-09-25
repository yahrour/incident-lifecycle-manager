FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma generate && npx prisma db push --accept-data-loss && npm run db:seed && npm run start:dev"]
