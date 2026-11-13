#!/bin/bash

{
    echo "export POSTGRES_HOST=$POSTGRES_HOST"
    echo "export VAULT_ADDR=$VAULT_ADDR"
    echo "export VAULT_TOKEN_FILE=${VAULT_TOKEN_FILE:-/vault/token/token}"
} > /etc/environment

echo "0 0 * * * source /etc/environment && /scripts/db.backup.sh" > /etc/crontabs/root

exec crond -f
