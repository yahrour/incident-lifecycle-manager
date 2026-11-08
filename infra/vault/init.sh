#!/bin/sh
set -eu

INIT_FILE="/vault/runtime/init.json"
TOKEN_FILE="/vault/runtime/backend-token"

mkdir -p /vault/data /vault/runtime

echo "[Vault] Starting Vault server (production mode, file backend)..."
vault server -config=/vault/config/config.hcl &
VAULT_PID=$!

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

echo "[Vault] Writing application secrets..."
vault kv put secret/incident-lifecycle-manager \
    DATABASE_URL="${DATABASE_URL}" \
    JWT_SECRET="${JWT_SECRET}" \
    JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}" \
    GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}" \
    GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}" \
    MAIL_USER="${MAIL_USER}" \
    MAIL_PASS="${MAIL_PASS}" \
    DISCORD_CLIENT_ID="${DISCORD_CLIENT_ID}" \
    DISCORD_CLIENT_SECRET="${DISCORD_CLIENT_SECRET}" >/dev/null

vault policy write incident-backend /usr/local/bin/policy.hcl >/dev/null

echo "[Vault] Creating scoped backend token..."
BACKEND_TOKEN=$(vault token create \
    -policy="incident-backend" \
    -period=24h \
    -format=json | jq -r '.auth.client_token')
echo "$BACKEND_TOKEN" > "$TOKEN_FILE"
chmod 600 "$TOKEN_FILE"

echo "[Vault] Ready."
wait "$VAULT_PID"
