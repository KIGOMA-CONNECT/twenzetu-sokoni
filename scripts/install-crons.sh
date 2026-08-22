#!/bin/bash
# Idempotently install/update the ops cron jobs (called by deploy.sh).
# Replaces ANY existing entry referencing the same script, then writes the
# canonical schedule — safe to re-run on every deploy.
set -u
BASE=/opt/afri-market
MARK="# afrimarket-ops"

install_entry() {
  local script="$1" spec="$2"
  local tmp
  tmp=$(mktemp)
  crontab -l 2>/dev/null | grep -v "scripts/$script" >"$tmp" || true
  echo "$spec $MARK" >>"$tmp"
  crontab "$tmp"
  rm -f "$tmp"
}

install_entry "auto-deploy.sh"            "*/2 * * * * $BASE/scripts/auto-deploy.sh >/dev/null 2>&1"
install_entry "monitor.sh"                "*/5 * * * * $BASE/scripts/monitor.sh >/dev/null 2>&1"
install_entry "business-metrics-alert.sh" "*/15 * * * * $BASE/scripts/business-metrics-alert.sh >/dev/null 2>&1"
install_entry "backup-db-prod.sh"         "17 3 * * * $BASE/scripts/backup-db-prod.sh >/dev/null 2>&1"
install_entry "cleanup-host-storage.sh"   "45 4 * * 0 $BASE/scripts/cleanup-host-storage.sh --apply >/dev/null 2>&1"

chmod +x "$BASE"/scripts/*.sh 2>/dev/null || true

echo "  ops crons ensured:"
crontab -l | grep "$MARK" | sed 's/^/    /'
