#!/bin/bash
# Business-metric alerts (cron every 15 min). Complements monitor.sh (which
# watches infrastructure) by watching the BUSINESS: payments that stall and
# order flow. Emails only when thresholds are breached, so it stays quiet when
# healthy. Config via /root/.monitor_smtp.conf (shared with monitor.sh).
#
# Cron line (host):
#   */15 * * * * /opt/afri-market/scripts/business-metrics-alert.sh >/dev/null 2>&1
set -u
M=/opt/afri-market/scripts
LOG=/opt/afri-market/backups/business-alerts.log
DB=afri-market-postgres
STUCK_THRESHOLD=${STUCK_THRESHOLD:-5}

exec >>"$LOG" 2>&1

q() { docker exec "$DB" psql -U postgres -d afri_market -tAc "$1" 2>&1; }

STUCK=$(q "SELECT count(*) FROM payments WHERE status='PENDING' AND initiated_at < NOW() - INTERVAL '30 minutes';")
ORDERS24=$(q "SELECT count(*) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours';")
FAILED24=$(q "SELECT count(*) FROM payments WHERE status='FAILED' AND initiated_at > NOW() - INTERVAL '24 hours';")

TS=$(date '+%F %T')
echo "$TS stuck=$STUCK orders24h=$ORDERS24 failedPayments24h=$FAILED24"

if [ "${STUCK:-x}" = "x" ]; then
  echo "  (db unreachable, skipping)" >> "$LOG"
  exit 0
fi

if [ "$STUCK" -ge "$STUCK_THRESHOLD" ]; then
  source /root/.monitor_smtp.conf
  export SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_FROM SMTP_TO
  MSG="Malipo $STUCK yamekwama PENDING kwa zaidi ya dakika 30.

Orders (24h): $ORDERS24
Malipo yaliyoshindikana (24h): $FAILED24

Kagua:
docker exec $DB psql -U postgres -d afri_market -c \"SELECT id,status,initiated_at FROM payments WHERE status='PENDING' AND initiated_at < NOW() - INTERVAL '30 minutes';\""
  echo "$MSG" | "$M/mail.py" "[twenzetu] ALERT: malipo $STUCK yamekwama" >> "$LOG" 2>&1 \
    || echo "  (email send failed)" >> "$LOG"
fi
