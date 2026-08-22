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

# CI gate: only deploy commits whose GitHub Actions checks all passed.
# Set REQUIRE_CI=0 to bypass (e.g. emergencies); default requires a passing
# run once CI exists, and proceeds untouched if no checks are reported.
TARGET=$(git rev-parse origin/master)
REPO=KIGOMA-CONNECT/twenzetu-sokoni
AUTH=()
[ -n "${GITHUB_TOKEN:-}" ] && AUTH=(-H "Authorization: Bearer $GITHUB_TOKEN")

ci_wait() {
  local tries="${1:-20}"
  local i total completed failures
  for ((i = 0; i < tries; i++)); do
    API=$(curl -s --max-time 20 ${AUTH[@]+"${AUTH[@]}"} \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/$REPO/commits/$TARGET/check-runs?per_page=100" 2>>"$LOG")
    if [ -z "$API" ] || echo "$API" | grep -q '"message": "Not Found"'; then
      echo "$(date '+%F %T') no CI data for $TARGET" >> "$LOG"
      [ "${REQUIRE_CI:-0}" = "1" ] && exit 1
      return 0
    fi
    total=$(echo "$API" | grep -c '"conclusion":' || true)
    completed=$(echo "$API" | grep -c '"status": "completed"' || true)
    failures=$(echo "$API" | grep -c '"conclusion": "failure"' || true)
    if [ "$failures" -gt 0 ]; then
      echo "$(date '+%F %T') CI FAILED on $TARGET -> deploy skipped" >> "$LOG"
      exit 1
    fi
    if [ "$total" -gt 0 ] && [ "$completed" -eq "$total" ]; then
      echo "$(date '+%F %T') CI passed on $TARGET ($total checks)" >> "$LOG"
      return 0
    fi
    echo "$(date '+%F %T') CI running ($completed/$total) for $TARGET, waiting..." >> "$LOG"
    sleep 60
  done
  echo "$(date '+%F %T') CI still unfinished after wait -> skipping deploy this cycle" >> "$LOG"
  exit 0
}
if [ "${REQUIRE_CI:-1}" != "0" ]; then
  ci_wait 25
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

