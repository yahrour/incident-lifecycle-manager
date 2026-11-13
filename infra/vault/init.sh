#!/bin/sh

set -eu


INIT_DIR="/vault/init"
INIT_FILE="$INIT_DIR/init.json"
READY_FILE="$INIT_DIR/.ready"
TOKENS_DIR="/vault/tokens"
SERVICES="backend postgres grafana exporter backup migrate"
TOKEN_PERIOD="720h"

mkdir -p /vault/data "$INIT_DIR" "$TOKENS_DIR"
rm -f "$READY_FILE"


echo "[Vault] Starting Vault server (production mode, file backend)..."
vault server -config=/vault/config/config.hcl &
VAULT_PID=$!

trap 'kill -TERM "$VAULT_PID" 2>/dev/null; wait "$VAULT_PID"; exit 0' TERM INT
export VAULT_ADDR="http://127.0.0.1:8200"
echo "[Vault] Waiting for Vault API..."
STATUS_JSON=""


for _ in $(seq 1 30); do
    STATUS_JSON=$(vault status -format=json 2>/dev/null || true)
    [ -n "$STATUS_JSON" ] && break
    sleep 1
done


INITIALIZED=$(echo "$STATUS_JSON" | jq -r '.initialized // false')

if [ "$INITIALIZED" != "true" ]; then
    echo "[Vault] Initializing (first boot)..."
    vault operator init -key-shares=1 -key-threshold=1 -format=json > "$INIT_FILE"
    chmod 600 "$INIT_FILE"
fi

if [ ! -s "$INIT_FILE" ]; then
    echo "[Vault] FATAL: Vault reports initialized but $INIT_FILE is missing." >&2
    echo "[Vault] The unseal key lives there. If the vault_init volume was" >&2
    echo "[Vault] removed while vault_data survived, this Vault cannot be" >&2
    echo "[Vault] unsealed again - restore the file or wipe both volumes." >&2
    exit 1
fi

UNSEAL_KEY=$(jq -r '.unseal_keys_b64[0]' "$INIT_FILE")
ROOT_TOKEN=$(jq -r '.root_token' "$INIT_FILE")
STATUS_JSON=$(vault status -format=json 2>/dev/null || true)
SEALED=$(echo "$STATUS_JSON" | jq -r '.sealed // true')

if [ "$SEALED" = "true" ]; then
    echo "[Vault] Unsealing..."
    vault operator unseal "$UNSEAL_KEY" >/dev/null
fi

export VAULT_TOKEN="$ROOT_TOKEN"

if ! vault secrets list -format=json | jq -e '."secret/"' >/dev/null 2>&1; then
    echo "[Vault] Enabling KV v2 at secret/..."
    vault secrets enable -path=secret kv-v2 >/dev/null
fi

uri() { jq -rn --arg v "$1" '$v|@uri'; }

echo "[Vault] Writing infrastructure secrets..."
vault kv put secret/postgres \
    POSTGRES_USER="${POSTGRES_USER}" \
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
    POSTGRES_DB="${POSTGRES_DB}" >/dev/null
vault kv put secret/grafana \
    GRAFANA_ADMIN_USER="${GRAFANA_ADMIN_USER}" \
    GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD}" >/dev/null

DATABASE_URL="postgresql://$(uri "$POSTGRES_USER"):$(uri "$POSTGRES_PASSWORD")@postgres:5432/$(uri "$POSTGRES_DB")"

echo "[Vault] Writing application secrets..."
vault kv put secret/incident-lifecycle-manager \
    DATABASE_URL="${DATABASE_URL}" \
    JWT_SECRET="${JWT_SECRET}" \
    JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}" \
    GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}" \
    GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}" >/dev/null

echo "[Vault] Writing policies and issuing per-service tokens..."

for SERVICE in $SERVICES; do

    vault policy write "incident-$SERVICE" \
        "/usr/local/bin/policies/$SERVICE.hcl" >/dev/null

    TOKEN=$(vault token create \
        -policy="incident-$SERVICE" \
        -period="$TOKEN_PERIOD" \
        -format=json | jq -r '.auth.client_token')

    mkdir -p "$TOKENS_DIR/$SERVICE"
    printf '%s' "$TOKEN" > "$TOKENS_DIR/$SERVICE/token"
    chmod 644 "$TOKENS_DIR/$SERVICE/token"
    echo "[Vault]   $SERVICE -> policy incident-$SERVICE"
done


touch "$READY_FILE"
echo "[Vault] Ready."
wait "$VAULT_PID"
