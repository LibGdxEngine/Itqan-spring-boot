#!/bin/sh
# Copies the video bucket to /backups/minio and, when BACKUP_S3_* is set, copies both the
# bucket and the database dumps (/backups/db) to an off-site S3-compatible bucket.
# Uses rclone so it works with MinIO or any other S3-compatible storage.
# Objects deleted from storage are kept in the backup on purpose (copy, not sync).
set -eu

export RCLONE_CONFIG_SRC_TYPE=s3
export RCLONE_CONFIG_SRC_PROVIDER=Other
export RCLONE_CONFIG_SRC_ENDPOINT="${STORAGE_ENDPOINT:-http://minio:9000}"
export RCLONE_CONFIG_SRC_ACCESS_KEY_ID="$MINIO_USER"
export RCLONE_CONFIG_SRC_SECRET_ACCESS_KEY="$MINIO_PASS"
export RCLONE_CONFIG_SRC_FORCE_PATH_STYLE=true

echo "[$(date)] Starting storage backup of bucket ${BUCKET}"
mkdir -p "/backups/minio/${BUCKET}"
rclone copy "src:${BUCKET}" "/backups/minio/${BUCKET}"
echo "[$(date)] Local copy done: $(du -sh "/backups/minio/${BUCKET}" | cut -f1)"

if [ -n "${BACKUP_S3_ENDPOINT:-}" ] && [ -n "${BACKUP_S3_BUCKET:-}" ]; then
    export RCLONE_CONFIG_OFFSITE_TYPE=s3
    export RCLONE_CONFIG_OFFSITE_PROVIDER=Other
    export RCLONE_CONFIG_OFFSITE_ENDPOINT="$BACKUP_S3_ENDPOINT"
    export RCLONE_CONFIG_OFFSITE_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY"
    export RCLONE_CONFIG_OFFSITE_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY"
    export RCLONE_CONFIG_OFFSITE_FORCE_PATH_STYLE=true

    echo "[$(date)] Copying to off-site bucket ${BACKUP_S3_BUCKET}"
    rclone copy "/backups/minio/${BUCKET}" "offsite:${BACKUP_S3_BUCKET}/minio/${BUCKET}"
    if [ -d /backups/db ]; then
        rclone copy /backups/db "offsite:${BACKUP_S3_BUCKET}/db"
    fi
    echo "[$(date)] Off-site copy done"
fi

echo "[$(date)] Done"
