#!/bin/bash
set -e
exec 9>/tmp/afri-deploy.lock
flock -n 9 || { echo "[deploy] another deploy running; skipping"; exit 0; }

ENV_FILE="${ENV_FILE:-.env.production}"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE=".env"
fi
DOMAIN="${1:-}"

echo "========================================="
echo "  afriMarket Production Deployment"
echo "========================================="

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: no .env.production or .env found!"
  echo "Copy .env.example to .env.production and fill in values."
  exit 1
fi

# Apply env overrides (e.g. GOOGLE_MAPS_API_KEY=xxx ./deploy.sh)
apply_env_override() {
  local key="$1" value="$2"
  if [ -n "$value" ] && [ -f "$ENV_FILE" ]; then
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
      sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
      echo "${key}=${value}" >> "$ENV_FILE"
    fi
    echo "  Applied ${key} to ${ENV_FILE}"
  fi
}

apply_env_override "GOOGLE_MAPS_API_KEY" "${GOOGLE_MAPS_API_KEY:-}"

# Load env vars
set -a; source "$ENV_FILE"; set +a

# SSL check
if [ ! -f "docker/nginx/ssl/fullchain.pem" ]; then
  echo ""
  echo "WARNING: SSL certificates not found in docker/nginx/ssl/"
  echo ""
  if [ -n "$DOMAIN" ]; then
    echo "Running SSL setup for $DOMAIN..."
    ./setup-ssl.sh "$DOMAIN"
  else
    echo "To set up Let's Encrypt SSL: ./setup-ssl.sh yourdomain.com"
    echo "To generate self-signed (dev only): ./generate-ssl.sh"
    echo ""
    echo "Deploying without SSL (HTTP only)..."
    echo "Set DOMAIN as argument to this script for automatic SSL setup."
  fi
fi

echo ""
echo "1. Pulling latest images..."
docker compose -f docker-compose.prod.yml pull 2>/dev/null || echo "  (pull skipped: images built locally)"

echo ""
echo "2. Building services (api --no-cache to avoid stale COPY --from=builder)..."
docker compose -f docker-compose.prod.yml build --no-cache api
docker compose -f docker-compose.prod.yml build web

echo ""
echo "3. Running database migrations (idempotent IF NOT EXISTS)..."
docker compose -f docker-compose.prod.yml run --rm api npm run migration:run:prod

echo ""
echo "4. Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "5. Waiting for API health (strong: fail-fast)..."
HEALTH_OK=0
for i in $(seq 1 24); do
  if docker compose -f docker-compose.prod.yml exec -T api wget -q -O- http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "  API is healthy."
    HEALTH_OK=1
    break
  fi
  if [ "$i" -eq 24 ]; then
    echo "  ERROR: API health check failed within 2 minutes — deployment considered FAILED."
    docker compose -f docker-compose.prod.yml ps
    docker compose -f docker-compose.prod.yml logs --tail 50 api
    exit 1
  else
    echo "  waiting... (${i}/24)"
    sleep 5
  fi
done
if [ "$HEALTH_OK" -ne 1 ]; then
  echo "  ERROR: API never became healthy."
  exit 1
fi

echo ""
echo "6. Checking service status..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "7. Ensuring ops crons are installed..."
bash scripts/install-crons.sh || echo "  (cron install skipped)"

echo ""
echo "========================================="
echo "  Deployment complete!"
echo ""
echo "  Web:  https://${DOMAIN:-localhost}/"
echo "  API:  https://${DOMAIN:-localhost}/api/"
echo ""
echo "  Logs: docker compose -f docker-compose.prod.yml logs -f"
echo "========================================="
