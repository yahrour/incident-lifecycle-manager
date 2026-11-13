FROM postgres:18-alpine

RUN apk add --no-cache bash curl jq

WORKDIR /scripts

COPY infra/vault/vault-fetch.sh /usr/local/bin/vault-fetch.sh
COPY infra/database/db-backup-service/db.backup.sh ./
COPY infra/database/db-backup-service/entrypoint.sh ./

RUN chmod +x ./db.backup.sh ./entrypoint.sh /usr/local/bin/vault-fetch.sh

ENTRYPOINT ["/scripts/entrypoint.sh"]
