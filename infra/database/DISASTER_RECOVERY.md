# Disaster Recovery Runbook

Steps to restore the database. Run all commands from the repo root.

> **Warning:** the restore replaces the current database with the backup. The previous database is kept as `<POSTGRES_DB>_old` until the next restore overwrites it.

## Step 1: Stop Services

Stop the app and the backup service so nothing writes during the restore.

```bash
docker compose stop frontend backend postgres-backup postgres-exporter
```

## Step 2: Check Backups

By default, the script restores the **most recent** `.sql` file in `./backups`. To restore a specific backup, pass its path as the second argument.

```bash
ls -lt ./backups
```

## Step 3: Run the Restore Script

```bash
# Restore the latest backup
POSTGRES_SERVICE_NAME=<service> POSTGRES_USER=<user> POSTGRES_DB=<db> bash infra/database/db.restore.sh ./backups

# Or restore a specific backup
POSTGRES_SERVICE_NAME=<service> POSTGRES_USER=<user> POSTGRES_DB=<db> bash infra/database/db.restore.sh ./backups ./backups/backup_2026-11-15_12-00-00.sql
```

## Step 4: Start Services

```bash
docker compose start frontend backend postgres-backup postgres-exporter
```
