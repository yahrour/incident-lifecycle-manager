#!/bin/sh

if [ -z "${VAULT_ADDR:-}" ]; then
    echo "[vault] VAULT_ADDR is not set" >&2
    exit 1
fi

if [ -z "${VAULT_TOKEN_FILE:-}" ]; then
    VAULT_TOKEN_FILE="/vault/token/token"
fi

if [ -z "${VAULT_WAIT_SECONDS:-}" ]; then
    VAULT_WAIT_SECONDS=90
fi

vault_wait() {
    vault_waited=0

    while [ "$vault_waited" -lt "$VAULT_WAIT_SECONDS" ]; do
        if [ -s "$VAULT_TOKEN_FILE" ]; then
            if curl -sf "$VAULT_ADDR/v1/sys/health?standbyok=true" >/dev/null 2>&1; then
                return 0
            fi
        fi

        sleep 1
        vault_waited=$((vault_waited + 1))
    done

    echo "[vault] not ready at $VAULT_ADDR after $VAULT_WAIT_SECONDS seconds" >&2
    return 1
}

vault_read() {
    kv_path="$1"
    vault_token=$(cat "$VAULT_TOKEN_FILE")

    curl -sf \
        -H "X-Vault-Token: $vault_token" \
        "$VAULT_ADDR/v1/secret/data/$kv_path"
}

vault_field() {
    json="$1"
    key="$2"

    echo "$json" | jq -re --arg k "$key" '.data.data[$k]'
}

vault_uri() {
    jq -rn --arg v "$1" '$v|@uri'
}

