#!/bin/bash
# afriMarket stack monitor with self-healing.
# Checks web + API health and backup freshness every 10 minutes (cron).
# If the web/API are unreachable, attempts to restart the Docker stack and
# re-checks, then emails an alert with what happened.
# Install: ./scripts/start-monitoring.sh
# Alerts email is configured via /root/.monitor_smtp.conf (SMTP_HOST/PORT/USER/PASS/FROM/TO).

M=/opt/afri-market/scripts
D=/opt/afri-market
LOG=/opt/afri-market/backups/monitor.log
PROBLEMS=""
RESTARTED=""

CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 https://twenzetusokoni.com)
if [ "$CODE" != "200" ]; then PROBLEMS="$PROBLEMS
- Web DOWN (HTTP $CODE)"; fi
HEALTH=$(curl -s --max-time 15 https://twenzetusokoni.com/api/health)
if ! echo "$HEALTH" | grep -q '"status":"ok"'; then PROBLEMS="$PROBLEMS
- API health FAILED"; fi

LATEST_BACKUP=$(ls -t /opt/afri-market/backups/afri_market_*.sql.gz 2>/dev/null | head -1)
if [ -z "$LATEST_BACKUP" ]; then
  PROBLEMS="$PROBLEMS
- No backup file found"
else
  AGE=$(( $(date +%s) - $(stat -c %Y "$LATEST_BACKUP") ))
  if [ "$AGE" -gt 93600 ]; then PROBLEMS="$PROBLEMS
- Backup stale ($((AGE/3600))h old)"; fi
fi

# Self-heal: if web or API are down, try to bring the whole stack back up.
if [ -n "$PROBLEMS" ] && { [ "$CODE" != "200" ] || ! echo "$HEALTH" | grep -q '"status":"ok"'; }; then
  echo "$(date '+%F %T') Attempting stack restart..." >> "$LOG"
  if ( cd "$D" && docker compose --env-file .env.production -f docker-compose.prod.yml up -d ) >> "$LOG" 2>&1; then
    sleep 25
    CODE2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 https://twenzetusokoni.com)
    HEALTH2=$(curl -s --max-time 15 https://twenzetusokoni.com/api/health)
    if [ "$CODE2" = "200" ] && echo "$HEALTH2" | grep -q '"status":"ok"'; then
      RESTARTED="
- Stack restarted and recovered at $(date '+%F %T')"
      PROBLEMS=""
    else
      RESTARTED="
- Stack restart attempted at $(date '+%F %T') but still DOWN (web=$CODE2)"
    fi
  else
    RESTARTED="
- Stack restart command FAILED at $(date '+%F %T')"
  fi
fi

if [ -n "$PROBLEMS" ] || [ -n "$RESTARTED" ]; then
  MSG="AFRIMARKET ALERT - $(date '+%F %T')$PROBLEMS$RESTARTED"
  echo "$MSG" >> "$LOG"
  source /root/.monitor_smtp.conf
  export SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_FROM SMTP_TO
  echo "$MSG" | "$M/mail.py" "AFRIMARKET ALERT" >> "$LOG" 2>&1 || echo "  (email send failed)" >> "$LOG"
else
  echo "$(date '+%F %T') OK" >> "$LOG"
fi