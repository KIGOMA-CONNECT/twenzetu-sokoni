#!/bin/bash
# afriMarket host storage cleanup.
# The disk fills up mainly from Docker build cache + dangling images created by
# every auto-deploy rebuild, oversized container json logs (containers started
# before log rotation was configured), journald growth and apt cache.
#
# Usage:
#   ./scripts/cleanup-host-storage.sh           # report only (safe)
#   ./scripts/cleanup-host-storage.sh --apply   # actually clean
#
# Safe to run via cron weekly:
#   0 4 * * 0 /opt/afri-market/scripts/cleanup-host-storage.sh --apply >> /opt/afri-market/backups/cleanup.log 2>&1
set -u

APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

M=/opt/afri-market/scripts
LOG=/opt/afri-market/backups/cleanup.log
DISK_WARN=85          # alert if root filesystem usage stays above this %
BUILDER_KEEP=2GB      # keep recent build cache for fast deploys
IMAGE_UNTIL=72h       # only prune unused images older than this
LOG_MAX_BYTES=$((50*1024*1024))
JOURNAL_KEEP=200MB

mkdir -p "$(dirname "$LOG")"

pct() { df --output=pcent / | tail -1 | tr -dc '0-9'; }

BEFORE_PCT=$(pct)
echo "===== $(date '+%F %T') cleanup start (apply=$APPLY) disk=${BEFORE_PCT}% =====" >> "$LOG"

if command -v docker >/dev/null 2>&1; then
  echo "--- docker system df (before) ---" >> "$LOG"
  docker system df >> "$LOG" 2>&1 || true

  if [ "$APPLY" = "1" ]; then
    echo "--- pruning stopped containers ---" >> "$LOG"
    docker container prune -f >> "$LOG" 2>&1 || true

    echo "--- pruning unused images older than $IMAGE_UNTIL ---" >> "$LOG"
    docker image prune -af --filter "until=$IMAGE_UNTIL" >> "$LOG" 2>&1 || true

    echo "--- pruning build cache (keeping $BUILDER_KEEP) ---" >> "$LOG"
    docker builder prune -af --keep-storage="$BUILDER_KEEP" >> "$LOG" 2>&1 || true

    echo "--- truncating container logs > ${LOG_MAX_BYTES} bytes ---" >> "$LOG"
    find /var/lib/docker/containers -name "*-json.log" -type f -size +${LOG_MAX_BYTES}c 2>/dev/null | while read -r f; do
      echo "  truncate $f ($(stat -c %s "$f") bytes)" >> "$LOG"
      : > "$f"
    done

    echo "--- docker system df (after) ---" >> "$LOG"
    docker system df >> "$LOG" 2>&1 || true
  fi
else
  echo "docker not found; skipping docker cleanup" >> "$LOG"
fi

if [ "$APPLY" = "1" ]; then
  if command -v journalctl >/dev/null 2>&1; then
    echo "--- vacuuming journal to $JOURNAL_KEEP ---" >> "$LOG"
    journalctl --vacuum-size="$JOURNAL_KEEP" >> "$LOG" 2>&1 || true
  fi
  if command -v apt-get >/dev/null 2>&1; then
    echo "--- apt clean ---" >> "$LOG"
    apt-get clean >> "$LOG" 2>&1 || true
  fi
fi

AFTER_PCT=$(pct)
FREED=$(( BEFORE_PCT - AFTER_PCT ))
echo "===== $(date '+%F %T') cleanup done disk=${AFTER_PCT}% (freed ~${FREED}pp) =====" >> "$LOG"

# Alert if the disk is still critically full after an apply run.
if [ "$APPLY" = "1" ] && [ "$AFTER_PCT" -ge "$DISK_WARN" ] && [ -f /root/.monitor_smtp.conf ]; then
  MSG="AFRIMARKET STORAGE WARNING - root filesystem still at ${AFTER_PCT}% after cleanup (was ${BEFORE_PCT}%).
Investigate manually: du -xh --max-depth=2 / | sort -rh | head -20"
  source /root/.monitor_smtp.conf
  export SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_FROM SMTP_TO
  echo "$MSG" | "$M/mail.py" "AFRIMARKET STORAGE WARNING" >> "$LOG" 2>&1 || true
fi
