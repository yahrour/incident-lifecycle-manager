#!/bin/bash

cat << EOF > /etc/environment
export POSTGRES_HOST=$POSTGRES_HOST
export POSTGRES_USER=$POSTGRES_USER
export POSTGRES_PASSWORD=$POSTGRES_PASSWORD
export POSTGRES_DB=$POSTGRES_DB
EOF

echo "* * * * * source /etc/environment && /scripts/db.backup.sh" > /etc/crontabs/root

exec crond -f -d 8
