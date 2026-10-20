#!/bin/bash

RED='\033[0;31m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# HELPER FUNCTIONS
log_info()    { echo -e "${BLUE}INFO: $1${NC}"; }
log_success() { echo -e "${GREEN}SUCCESS: $1${NC}"; }
log_warn()    { echo -e "${YELLOW}WARNING: $1${NC}"; }
log_error()   { echo -e "${RED}ERROR: $1${NC}"; }

# Usage: bash ./infra/database/db.restore.sh <env_file> [backup_dir]
set -e

if [[ -z "$1" || -z "$2" ]]; then
    log_error "Usage: $0 <env_file> [backup_dir]";
    exit 1;
fi

source "$1"

BACKUP_DIR="${2}"
BACKUP=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -n 1)
if [ -z "$BACKUP" ]; then
  log_error "No .sql backup found in $BACKUP_DIR";
  exit 1;
fi

psql() { docker compose exec -T "$POSTGRES_SERVICE_NAME" psql -U "$POSTGRES_USER" -q -v ON_ERROR_STOP=1 "$@"; }

log_info "Restoring $BACKUP"
psql -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB WITH (FORCE);" -c "CREATE DATABASE $POSTGRES_DB;"
psql -d "$POSTGRES_DB" < "$BACKUP" > /dev/null

for SCHEMA in organization auth ingestion incident; do
  COUNT=$(psql -d "$POSTGRES_DB" -tA -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='$SCHEMA';")
  [ "$COUNT" -gt 0 ] && log_success "OK: $SCHEMA ($COUNT tables)" || log_warn "WARNING: $SCHEMA has 0 tables"
done
