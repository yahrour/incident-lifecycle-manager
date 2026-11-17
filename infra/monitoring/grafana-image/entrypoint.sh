#!/bin/sh

set -eu

. /usr/local/bin/vault-fetch.sh

vault_wait

SECRETS=$(vault_read grafana)
GF_SECURITY_ADMIN_USER=$(vault_field "$SECRETS" GRAFANA_ADMIN_USER)
GF_SECURITY_ADMIN_PASSWORD=$(vault_field "$SECRETS" GRAFANA_ADMIN_PASSWORD)
export GF_SECURITY_ADMIN_USER GF_SECURITY_ADMIN_PASSWORD
SECRETS=

echo "[grafana] admin credentials loaded from Vault"

exec /run.sh
