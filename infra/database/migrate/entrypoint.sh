#!/bin/sh
set -e

. /usr/local/bin/vault-fetch.sh

vault_wait

SECRETS=$(vault_read incident-lifecycle-manager)
DATABASE_URL=$(vault_field "$SECRETS" DATABASE_URL)
export DATABASE_URL
SECRETS=

echo "[migrate] DATABASE_URL loaded from Vault; applying schema"

exec "$@"
