#!/bin/sh
# Restores a dump made by db-backup.sh into the running postgres container.
# Usage (from the repo root): scripts/db-restore.sh itqan_edu_20260101_020000.sql.gz
# Stop the backend first so nothing writes during the restore.
set -eu

FILE="${1:?usage: scripts/db-restore.sh <backup file name>}"

docker compose exec -T postgres-backup sh -c "test -f /backups/db/${FILE}" \
    || { echo "No such backup: ${FILE}. Available:"; docker compose exec -T postgres-backup ls /backups/db; exit 1; }

echo "Restoring ${FILE} into ${POSTGRES_DB:-itqan_edu}. This replaces the current data."
printf 'Type "restore" to continue: '
read -r answer
[ "$answer" = "restore" ] || { echo "Cancelled"; exit 1; }

docker compose exec -T postgres-backup sh -c "gunzip -c /backups/db/${FILE} | psql -v ON_ERROR_STOP=1 -q"
echo "Restore complete. Start the backend again."
