#!/bin/bash
set -e

# afriMarket Database Backup Script
# Usage: ./scripts/backup-db.sh [output-dir]
# Set these env vars or use .env.production:
#   DB_HOST, DB_PORT, DB_NAME, DB_RUNTIME_USER, DB_RUNTIME_PASSWORD

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$SCRIPT_DIR/.env.production" ]; then
  set -a; source "$SCRIPT_DIR/.env.production"; set +a
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5434}"
DB_NAME="${DB_NAME:-afri_market}"
DB_USER="${DB_RUNTIME_USER:-afri_runtime}"
DB_PASS="${DB_RUNTIME_PASSWORD:-afri_runtime_dev_password}"
OUTPUT_DIR="${1:-$SCRIPT_DIR/backups}"
RETENTION_DAYS=30

mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="afri_market_${TIMESTAMP}.sql.gz"
FILEPATH="${OUTPUT_DIR}/${FILENAME}"

echo "========================================="
echo "  afriMarket Database Backup"
echo "========================================="
echo "  Host:     $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  Output:   $FILEPATH"
echo ""

export PGPASSWORD="$DB_PASS"

pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --no-owner \
  --no-acl \
  --format=custom \
  --verbose \
  --file="${FILEPATH%.gz}" || {
    echo "ERROR: Backup failed!"
    exit 1
  }

gzip "${FILEPATH%.gz}"
echo ""
echo "Backup complete: $FILEPATH"

# Rotate old backups
find "$OUTPUT_DIR" -name "afri_market_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Removed backups older than ${RETENTION_DAYS} days"

# Optional: Upload to S3-compatible storage
if [ -n "$BACKUP_S3_BUCKET" ]; then
  echo ""
  echo "Uploading to S3: s3://${BACKUP_S3_BUCKET}/"
  aws s3 cp "$FILEPATH" "s3://${BACKUP_S3_BUCKET}/database/" --storage-class STANDARD_IA 2>/dev/null || \
    echo "WARNING: S3 upload failed. Check AWS credentials."
fi

echo ""
echo "Done."
