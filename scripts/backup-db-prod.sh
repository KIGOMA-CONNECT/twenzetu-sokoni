#!/bin/bash
set -e

# afriMarket Production Database Backup
# Runs pg_dump inside the postgres container (DB is not exposed on the host).
# Usage: ./scripts/backup-db-prod.sh [output-dir]
# Optional env: BACKUP_S3_BUCKET (upload to S3-compatible storage)

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose.prod.yml"
if [ -f ".env.production" ]; then
  set -a; source ".env.production"; set +a
fi

DB_NAME="${DB_NAME:-afri_market}"
DB_BOOTSTRAP_USER="${DB_BOOTSTRAP_USER:-postgres}"
OUTPUT_DIR="${1:-$SCRIPT_DIR/backups}"
RETENTION_DAYS=30

mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="afri_market_${TIMESTAMP}.sql.gz"
FILEPATH="${OUTPUT_DIR}/${FILENAME}"

echo "========================================="
echo "  afriMarket Production Database Backup"
echo "========================================="
echo "  Database: $DB_NAME"
echo "  Output:   $FILEPATH"
echo ""

docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
  --username="$DB_BOOTSTRAP_USER" \
  --dbname="$DB_NAME" \
  --no-owner \
  --no-acl \
  --format=custom | gzip > "$FILEPATH"

echo ""
echo "Backup complete: $FILEPATH"

# Rotate old backups
find "$OUTPUT_DIR" -name "afri_market_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Removed backups older than ${RETENTION_DAYS} days"

# Optional: Upload to S3-compatible storage
if [ -n "$BACKUP_S3_BUCKET" ]; then
  if command -v rclone >/dev/null 2>&1; then
    echo ""
    echo "Uploading to S3 (rclone): s3://${BACKUP_S3_BUCKET}/database/"
    if rclone listremotes 2>/dev/null | grep -q '^afrimarket-s3:'; then
      rclone copy "$FILEPATH" "afrimarket-s3:${BACKUP_S3_BUCKET}/database/" 2>/dev/null || \
        echo "WARNING: rclone S3 upload failed."
      rclone delete --min-age ${RETENTION_DAYS}d "afrimarket-s3:${BACKUP_S3_BUCKET}/database/" 2>/dev/null || true
    else
      echo "WARNING: rclone remote 'afrimarket-s3' not configured; skipping S3 upload."
    fi
  else
    echo "WARNING: rclone not installed; skipping S3 upload."
  fi
fi


# Optional: Upload to Google Drive via rclone
BACKUP_GDRIVE_FOLDER="${BACKUP_GDRIVE_FOLDER:-afrimarket-backups}"
if command -v rclone >/dev/null 2>&1 && rclone listremotes 2>/dev/null | grep -q '^gdrive:'; then
  echo ""
  echo "Uploading to Google Drive: gdrive:${BACKUP_GDRIVE_FOLDER}/database/"
  rclone copy "$FILEPATH" "gdrive:${BACKUP_GDRIVE_FOLDER}/database/" 2>/dev/null || \
    echo "WARNING: Google Drive upload failed."
  rclone delete --min-age ${RETENTION_DAYS}d "gdrive:${BACKUP_GDRIVE_FOLDER}/database/" 2>/dev/null || true
fi
echo ""
echo "Done."
