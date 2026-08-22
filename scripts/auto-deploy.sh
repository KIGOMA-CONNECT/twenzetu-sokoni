#!/bin/bash
# Auto-deploy afriMarket from origin/master (run via cron; safe to run concurrently).
set -u
LOG=/opt/afri-market/backups/deploy.log
LOCK=/tmp/afri-auto-deploy.lock
mkdir -p /opt/afri-market/backups

exec 9>"$LOCK"
flock -n 9 || { echo "$(date '+%F %T') deploy already running, skipped" >> "$LOG"; exit 0; }

cd /opt/afri-market
git fetch origin -q 2>>"$LOG" || { echo "$(date '+%F %T') git fetch failed" >> "$LOG"; exit 1; }

BEHIND=$(git rev-list --count HEAD..origin/master 2>/dev/null || echo 0)
if [ "$BEHIND" -le 0 ]; then
  exit 0
fi

echo "$(date '+%F %T') $BEHIND new commit(s) behind origin/master -> deploying" >> "$LOG"

# A full disk breaks image builds mid-deploy; reclaim space first.
DISK_PCT=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if [ "$DISK_PCT" -ge 90 ]; then
  echo "$(date '+%F %T') disk at ${DISK_PCT}% -> running storage cleanup before build" >> "$LOG"
  "$PWD/scripts/cleanup-host-storage.sh" --apply >> "$LOG" 2>&1 || true
fi

git pull --ff-only origin master >>"$LOG" 2>&1 || { echo "$(date '+%F %T') git pull failed" >> "$LOG"; exit 1; }
./deploy.sh >>"$LOG" 2>&1
echo "$(date '+%F %T') deploy finished (exit $?)" >> "$LOG"

