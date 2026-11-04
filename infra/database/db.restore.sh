#!/bin/bash

set -e

RED='\033[0;31m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}INFO: $1${NC}"; }
log_success() { echo -e "${GREEN}SUCCESS: $1${NC}"; }
log_warn()    { echo -e "${YELLOW}WARNING: $1${NC}"; }
log_error()   { echo -e "${RED}ERROR: $1${NC}"; }

if [[ -z "$1" || -z "$2" ]]; then
    log_error "Usage: $0 <env_file> <backup_dir>";
    exit 1;
fi

source "$1"

BACKUP_DIR="${2}"
BACKUP=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -n 1)
if [ -z "$BACKUP" ]; then
  log_error "No .sql backup found in $BACKUP_DIR";
  exit 1;
fi

TMP_DB="${POSTGRES_DB}_tmp"
OLD_DB="${POSTGRES_DB}_old"

psql() { docker compose exec -T "$POSTGRES_SERVICE_NAME" psql -U "$POSTGRES_USER" -q -v ON_ERROR_STOP=1 "$@"; }

log_info "Restoring $BACKUP"

psql -d postgres -c "DROP DATABASE IF EXISTS $TMP_DB WITH (FORCE);"
psql -d postgres -c "CREATE DATABASE $TMP_DB;"
psql -d "$TMP_DB" < "$BACKUP" > /dev/null

psql -d postgres \
  -c "DROP DATABASE IF EXISTS $OLD_DB WITH (FORCE);" \
  -c "ALTER DATABASE $POSTGRES_DB RENAME TO $OLD_DB;" \
  -c "ALTER DATABASE $TMP_DB RENAME TO $POSTGRES_DB;"

for SCHEMA in organization auth ingestion incident; do
  COUNT=$(psql -d "$POSTGRES_DB" -tA -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='$SCHEMA';")
  [ "$COUNT" -gt 0 ] && log_success "$SCHEMA ($COUNT tables)" || log_warn "$SCHEMA has 0 tables"
done
