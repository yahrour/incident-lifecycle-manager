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

notify() {
  curl -fsS -H "Content-Type: application/json" \
    -d "{\"content\": \"$1\"}" "$WEBHOOK_URL" >/dev/null
}

# MAIN LOGIC
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

ls $BACKUP_DIR

log_info "Starting database backup at $TIMESTAMP..."

PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB > $BACKUP_FILE

if [ $? -eq 0 ]; then
  log_success "Backup successfully created: $BACKUP_FILE"
  notify "Database backup succeeded: backup_$TIMESTAMP.sql"
else
  log_error "Backup failed"
  notify "DATABASE BACKUP FAILED, Check server logs immediately"
fi
