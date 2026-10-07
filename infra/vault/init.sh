#!/bin/sh

set -e

echo "[Vault] Starting Vault..."

vault server \
    -dev \
    -dev-root-token-id="${VAULT_DEV_ROOT_TOKEN_ID}" \
    -dev-listen-address="0.0.0.0:8200" &

VAULT_PID=$!

export VAULT_ADDR="http://127.0.0.1:8200"
export VAULT_TOKEN="${VAULT_DEV_ROOT_TOKEN_ID}"

echo "[Vault] Waiting for Vault..."

until vault status >/dev/null 2>&1; do
    sleep 1
done

echo "[Vault] Vault is ready!"

echo "[Vault] Storing application secrets..."

vault kv put secret/incident-lifecycle-manager \
    DATABASE_URL="${DATABASE_URL}" \
    JWT_SECRET="${JWT_SECRET}" \
    JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}" \
    GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}" \
    GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}" \
    MAIL_USER="${MAIL_USER}" \
    MAIL_PASS="${MAIL_PASS}" \
    DISCORD_CLIENT_ID="${DISCORD_CLIENT_ID}" \
    DISCORD_CLIENT_SECRET="${DISCORD_CLIENT_SECRET}"

echo "[Vault] Secrets stored successfully!"

echo "[Vault] Creating backend policy..."

vault policy write incident-backend /usr/local/bin/policy.hcl

echo "[Vault] Backend policy created."

echo "[Vault] Creating backend token..."

BACKEND_TOKEN=$(vault token create \
    -policy="incident-backend" \
    -format=json | jq -r '.auth.client_token')

echo "$BACKEND_TOKEN" > /vault/runtime/backend-token
chmod 600 /vault/runtime/backend-token

echo "[Vault] Backend token created."

wait "$VAULT_PID"
