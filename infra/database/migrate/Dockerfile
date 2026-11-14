FROM node:24-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl jq \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package*.json backend/prisma.config.ts ./
RUN npm ci
COPY backend/prisma ./prisma

COPY infra/vault/vault-fetch.sh /usr/local/bin/vault-fetch.sh
COPY infra/database/migrate/entrypoint.sh /usr/local/bin/vault-entrypoint.sh
RUN chmod +x /usr/local/bin/vault-entrypoint.sh /usr/local/bin/vault-fetch.sh

ENTRYPOINT ["/usr/local/bin/vault-entrypoint.sh"]
CMD ["npx", "prisma", "db", "push"]
