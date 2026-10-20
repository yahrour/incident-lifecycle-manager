#!/bin/bash

RED='\033[0;31m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

# HELPER FUNCTIONS

log_info()    { echo -e "${BLUE}INFO: $1${NC}"; }
log_success() { echo -e "${GREEN}SUCCESS: $1${NC}"; }
log_error()   { echo -e "${RED}ERROR: $1${NC}"; }

# MAIN LOGIC
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_PATH="/backups/backup_$TIMESTAMP.sql"

log_info "Starting database backup at $TIMESTAMP"

PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB > $BACKUP_PATH

if [ $? -eq 0 ]; then
  log_success "Backup successfully created: $BACKUP_PATH"
else
  log_error "Backup failed"
fi
