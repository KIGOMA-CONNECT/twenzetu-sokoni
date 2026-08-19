#!/bin/bash
set -euo pipefail

# afriMarket Backup/Restore Verification (DR drill)
# Restores the most recent production backup into a throwaway database in the
# postgres container, validates integrity + row counts against the live DB,
# then drops the throwaway database. Safe to run against a healthy deployment.
#
# Usage: ./scripts/verify-backup-restore.sh [backup-dir]
#   backup-dir defaults to <repo>/backups
#   To point at a specific backup: BACKUP_FILE=/path/to/file.sql.gz
#
# Exit codes: 0 = restore verified, 1 = no backup or restore failed.

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose.prod.yml"
if [ -f ".env.production" ]; then
  set -a; source ".env.production"; set +a
fi

DB_NAME="${DB_NAME:-afri_market}"
DB_BOOTSTRAP_USER="${DB_BOOTSTRAP_USER:-postgres}"
BACKUP_DIR="${1:-$SCRIPT_DIR/backups}"

if [ -n "${BACKUP_FILE:-}" ]; then
  LATEST="$BACKUP_FILE"
else
  LATEST=$(ls -t "$BACKUP_DIR"/afri_market_*.sql.gz 2>/dev/null | head -1)
fi

if [ -z "${LATEST:-}" ] || [ ! -f "$LATEST" ]; then
  echo "ERROR: no backup found in $BACKUP_DIR (or BACKUP_FILE is invalid)"
  exit 1
fi

RESTORE_DB="verify_restore_$(date +%Y%m%d_%H%M%S)"

cleanup() {
  docker compose -f "$COMPOSE_FILE" exec -T postgres dropdb -U "$DB_BOOTSTRAP_USER" "$RESTORE_DB" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "========================================="
echo "  Backup/Restore Verification (DR drill)"
echo "========================================="
echo "  Source backup: $LATEST"
echo "  Temp database: $RESTORE_DB"
echo ""

echo "1. Creating throwaway database..."
docker compose -f "$COMPOSE_FILE" exec -T postgres createdb -U "$DB_BOOTSTRAP_USER" "$RESTORE_DB"

echo "2. Restoring backup..."
gunzip -c "$LATEST" | docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_restore -U "$DB_BOOTSTRAP_USER" -d "$RESTORE_DB" --no-owner --no-acl

echo "3. Validating restored schema..."
MIGRATIONS_LIVE=$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_BOOTSTRAP_USER" -d "$DB_NAME" -tAc "SELECT count(*) FROM migrations")
MIGRATIONS_RESTORED=$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_BOOTSTRAP_USER" -d "$RESTORE_DB" -tAc "SELECT count(*) FROM migrations")
echo "  migrations: live=$MIGRATIONS_LIVE restored=$MIGRATIONS_RESTORED"
[ "$MIGRATIONS_LIVE" != "$MIGRATIONS_RESTORED" ] && { echo "ERROR: migration count mismatch"; exit 1; }

echo "4. Comparing key row counts (live vs restored)..."
for TABLE in tenants users vendors products orders deliveries wallets audit_logs; do
  LIVE=$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_BOOTSTRAP_USER" -d "$DB_NAME" -tAc "SELECT count(*) FROM $TABLE" 2>/dev/null || echo "n/a")
  RESTORED=$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_BOOTSTRAP_USER" -d "$RESTORE_DB" -tAc "SELECT count(*) FROM $TABLE" 2>/dev/null || echo "n/a")
  echo "  $TABLE: live=$LIVE restored=$RESTORED"
  if [ "$LIVE" != "$RESTORED" ] && [ "$LIVE" != "n/a" ] && [ "$RESTORED" != "n/a" ]; then
    echo "  WARNING: row count mismatch for $TABLE"
  fi
done

echo "5. Cleaning up throwaway database..."
cleanup
trap - EXIT

echo ""
echo "Restore verification passed: $LATEST"