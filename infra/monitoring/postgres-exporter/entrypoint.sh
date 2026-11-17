#!/bin/sh

set -eu

. /usr/local/bin/vault-fetch.sh

vault_wait

SECRETS=$(vault_read postgres)
PG_USER=$(vault_field "$SECRETS" POSTGRES_USER)
PG_PASSWORD=$(vault_field "$SECRETS" POSTGRES_PASSWORD)
SECRETS=

DATA_SOURCE_NAME="postgresql://$(vault_uri "$PG_USER"):$(vault_uri "$PG_PASSWORD")@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_SCRAPE_DB}?sslmode=disable"
export DATA_SOURCE_NAME
PG_PASSWORD=

echo "[postgres-exporter] data source built from Vault for user '$PG_USER'"

exec /bin/postgres_exporter
