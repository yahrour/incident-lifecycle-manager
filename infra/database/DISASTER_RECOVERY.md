# Disaster Recovery Runbook

Steps to restore the database. Run all commands from the repo root.

> **Warning:** the restore drops the current database and replaces it with the backup.

## Step 1: Stop Services

Stop the app and the backup service so nothing writes during the restore.

```bash
docker compose stop frontend backend postgres-backup
```

## Step 2: Check Backups

The script restores the **most recent** `.sql` file in `./backups`.

```bash
ls -lt ./backups
```

## Step 3: Run the Restore Script

```bash
bash ./infra/database/db.restore.sh ./infra/.env ./backups
```

## Step 4: Start Services

```bash
docker compose start frontend backend postgres-backup
```
