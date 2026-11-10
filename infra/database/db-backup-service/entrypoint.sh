#!/bin/bash

echo "export POSTGRES_HOST=$POSTGRES_HOST" > /etc/environment

echo "* * * * * source /etc/environment && /scripts/db.backup.sh" > /etc/crontabs/root

exec crond -f
