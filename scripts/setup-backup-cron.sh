#!/bin/bash
set -e

# afriMarket Automated Backup Cron Setup
# Installs a crontab entry that runs the production backup daily at 02:30.
# Usage: ./scripts/setup-backup-cron.sh

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/scripts/backup-db-prod.sh"
LOG_FILE="$SCRIPT_DIR/backups/backup.log"
CRON_LINE="30 2 * * * $BACKUP_SCRIPT >> $LOG_FILE 2>&1"

mkdir -p "$SCRIPT_DIR/backups"

# Remove any existing afriMarket backup cron entries, then add the new one
( crontab -l 2>/dev/null | grep -v 'backup-db-prod.sh' ; echo "$CRON_LINE" ) | crontab -

echo "========================================="
echo "  afriMarket Automated Backup Cron"
echo "========================================="
echo "  Schedule: daily at 02:30"
echo "  Script:   $BACKUP_SCRIPT"
echo "  Log:      $LOG_FILE"
echo ""
echo "  Current crontab:"
crontab -l
echo ""
echo "Done."
