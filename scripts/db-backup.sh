#!/bin/sh
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
BACKUP_FILE="${BACKUP_DIR}/itqan_edu_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup to ${BACKUP_FILE}"

pg_dump --clean --if-exists --no-owner --no-privileges "$PGDATABASE" | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup complete: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Optionally upload to S3 if AWS CLI is available and S3_BACKUP_BUCKET is set
if [ -n "$S3_BACKUP_BUCKET" ] && command -v aws >/dev/null 2>&1; then
    echo "[$(date)] Uploading to s3://${S3_BACKUP_BUCKET}/"
    aws s3 cp "$BACKUP_FILE" "s3://${S3_BACKUP_BUCKET}/$(basename "$BACKUP_FILE")"
fi

# Purge old backups
echo "[$(date)] Purging backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -type f -name 'itqan_edu_*.sql.gz' -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Done"
