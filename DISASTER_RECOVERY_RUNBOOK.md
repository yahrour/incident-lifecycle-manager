# Disaster Recovery Runbook

This document outlines the steps to recover the database.

## Step 1: Isolate & Stop Traffic

Before restoring, stop the services to prevent users from writing new data while the recovery is running.

```bash
docker compose stop incident_web_app
docker compose stop ingestion_service
```

## Step 2: Verify Backup Files

Ensure having a valid backup file in `./backups` directory.

```bash
ls -lh ./backups
```

## Step 3: Run the Restore Script

```bash
chmod +x ./scripts/restore.sh
bash ./scripts/restore.sh ./backups
```

## Step 4: Bring Services Back Online

Start the services once the recovery process is done.

```bash
docker compose start incident_web_app
docker compose start ingestion_service
```
