#!/bin/bash
set -e

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


# PREREQUISITE CHECKS

# Ensure environment variables are loaded
if [ -f .env ]; then
    source .env
else
    log_error ".env file not found."
    exit 1
fi

# Ensure backup directory argument was passed
if [ $# -eq 0 ]; then
    log_error "Missing required backup directory argument."
    echo -e "Usage: $0 ./backups"
    exit 1
fi

# Verify the backup directory actually exists
BACKUP_DIR="$1"
if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Directory '${BACKUP_DIR}' does not exist."
    exit 1
fi

# Locate the most recent backup SQL file
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/*.sql 2>/dev/null | head -n 1)
if [ -z "$LATEST_BACKUP" ]; then
    log_error "No backup files (.sql) found in ${BACKUP_DIR}."
    exit 1
fi

# DATABASE DESTRUCTION & RECREATION

log_info "Preparing database for recovery using: ${LATEST_BACKUP}"

# Revoke active user connections from target database
docker compose exec -T "$POSTGRES_SERVICE_NAME" psql -U "$POSTGRES_USER" -d postgres -c \
  "REVOKE CONNECT ON DATABASE $POSTGRES_DB FROM public;
   SELECT pg_terminate_backend(pg_stat_activity.pid)
   FROM pg_stat_activity
   WHERE pg_stat_activity.datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" > /dev/null

# Recreate the database
docker compose exec -T "$POSTGRES_SERVICE_NAME" psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" > /dev/null
docker compose exec -T "$POSTGRES_SERVICE_NAME" psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB;" > /dev/null

# STREAM RESTORE DATA
log_info "Streaming data into database..."
docker compose exec -T "$POSTGRES_SERVICE_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$LATEST_BACKUP" > /dev/null


# MULTI-SCHEMA VERIFICATION

log_info "Running automatic schema verification..."
SCHEMAS=("organization" "auth" "alerts")

for SCHEMA in "${SCHEMAS[@]}"; do
    TABLE_COUNT=$(docker compose exec -T "$POSTGRES_SERVICE_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='${SCHEMA}';")

    # Clean whitespace format from database response
    TABLE_COUNT=$(echo "$TABLE_COUNT" | xargs)

    if [ "$TABLE_COUNT" -gt 0 ]; then
        log_success "Found $TABLE_COUNT tables in the '${SCHEMA}' schema."
    else
        log_warn "Restore completed, but 0 tables found in the '${SCHEMA}' schema!"
    fi
done
