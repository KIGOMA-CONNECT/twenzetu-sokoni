#!/bin/bash
set -e

# afriMarket Monitoring Stack
# Starts Prometheus + Grafana + node-exporter + postgres-exporter.
# Services bind to 127.0.0.1 only; access Grafana via SSH tunnel:
#   ssh -L 3001:127.0.0.1:3001 root@<server>
# Usage: ./scripts/start-monitoring.sh

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE=".env"
fi
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: no .env.production or .env found. Run from the project root or copy it first."
  exit 1
fi

set -a; source "$ENV_FILE"; set +a

echo "========================================="
echo "  afriMarket Monitoring Stack"
echo "========================================="
echo "  Starting Prometheus, Grafana, node-exporter, postgres-exporter..."
docker compose -f docker-compose.monitoring.yml up -d

echo ""
echo "  Services (bound to 127.0.0.1):"
echo "    Prometheus: http://127.0.0.1:9090"
echo "    Grafana:    http://127.0.0.1:3001 (admin / \$GRAFANA_ADMIN_PASSWORD)"
echo ""
echo "  Access via SSH tunnel:"
echo "    ssh -L 3001:127.0.0.1:3001 -L 9090:127.0.0.1:9090 root@<server>"
echo ""
echo "Done."
