#!/bin/sh

set -eu

. /usr/local/bin/vault-fetch.sh

vault_wait

SECRETS=$(vault_read postgres)
POSTGRES_USER=$(vault_field "$SECRETS" POSTGRES_USER)
POSTGRES_PASSWORD=$(vault_field "$SECRETS" POSTGRES_PASSWORD)
POSTGRES_DB=$(vault_field "$SECRETS" POSTGRES_DB)
export POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB
SECRETS=

echo "[postgres] credentials loaded from Vault for user '$POSTGRES_USER'"

exec docker-entrypoint.sh "$@"
