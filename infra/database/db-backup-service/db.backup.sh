#!/bin/bash

set -e

RED='\033[0;31m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}INFO: $1${NC}"; }
log_success() { echo -e "${GREEN}SUCCESS: $1${NC}"; }
log_error()   { echo -e "${RED}ERROR: $1${NC}"; }

POSTGRES_USER=$(cat /vault/secrets/postgres_user)
POSTGRES_PASSWORD=$(cat /vault/secrets/postgres_password)
POSTGRES_DB=$(cat /vault/secrets/postgres_db)

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_PATH="/backups/backup_$TIMESTAMP.sql"

log_info "Starting database backup at $TIMESTAMP"

if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$BACKUP_PATH.tmp"; then
  mv "$BACKUP_PATH.tmp" "$BACKUP_PATH"
  log_success "Backup successfully created: $BACKUP_PATH"
else
  rm -f "$BACKUP_PATH.tmp"
  log_error "Backup failed"
  exit 1
fi
