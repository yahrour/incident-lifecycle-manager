# Disaster Recovery Runbook

Steps to restore the database. Run all commands from the repo root.

> **Warning:** the restore replaces the current database with the backup. The previous database is kept as `<POSTGRES_DB>_old` until the next restore overwrites it.

## Step 1: Stop Services

Stop the app and the backup service so nothing writes during the restore.

```bash
docker compose stop frontend backend postgres-backup postgres-exporter
```

## Step 2: Check Backups

The script restores the **most recent** `.sql` file in `./backups`.

```bash
ls -lt ./backups
```

## Step 3: Run the Restore Script

```bash
POSTGRES_SERVICE_NAME=<service> POSTGRES_USER=<user> POSTGRES_DB=<db> bash db.restore.sh ./backups
```

## Step 4: Start Services

```bash
docker compose start frontend backend postgres-backup postgres-exporter
```
