#!/bin/bash

echo "export POSTGRES_HOST=$POSTGRES_HOST" > /etc/environment

echo "0 0 * * * source /etc/environment && /scripts/db.backup.sh" > /etc/crontabs/root

exec crond -f
