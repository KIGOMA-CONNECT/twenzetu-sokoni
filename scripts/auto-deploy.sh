#!/bin/bash
# Auto-deploy afriMarket from origin/main (run via cron; safe to run concurrently).
set -u
LOG=/opt/afri-market/backups/deploy.log
LOCK=/tmp/afri-deploy.lock
mkdir -p /opt/afri-market/backups

exec 9>"$LOCK"
flock -n 9 || { echo "$(date '+%F %T') deploy already running, skipped" >> "$LOG"; exit 0; }

cd /opt/afri-market
git fetch origin -q 2>>"$LOG" || { echo "$(date '+%F %T') git fetch failed" >> "$LOG"; exit 1; }

BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
if [ "$BEHIND" -le 0 ]; then
  exit 0
fi

echo "$(date '+%F %T') $BEHIND new commit(s) behind origin/main -> deploying" >> "$LOG"
git pull --ff-only origin main >>"$LOG" 2>&1 || { echo "$(date '+%F %T') git pull failed" >> "$LOG"; exit 1; }
./deploy.sh >>"$LOG" 2>&1
echo "$(date '+%F %T') deploy finished (exit $?)" >> "$LOG"

