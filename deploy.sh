#!/bin/bash
set -e

ENV_FILE="${ENV_FILE:-.env.production}"
DOMAIN="${1:-}"

echo "========================================="
echo "  afriMarket Production Deployment"
echo "========================================="

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found!"
  echo "Copy .env.production.example to .env.production and fill in values."
  exit 1
fi

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
docker compose -f docker-compose.prod.yml pull

echo ""
echo "2. Building services..."
docker compose -f docker-compose.prod.yml build

echo ""
echo "3. Running database migrations..."
docker compose -f docker-compose.prod.yml run --rm api npm run migration:run:prod

echo ""
echo "4. Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "5. Waiting for API health..."
for i in $(seq 1 24); do
  if docker compose -f docker-compose.prod.yml exec -T api wget -q -O- http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "  API is healthy."
    break
  fi
  if [ "$i" -eq 24 ]; then
    echo "  WARNING: API health check did not pass within 2 minutes."
  else
    echo "  waiting... (${i}/24)"
    sleep 5
  fi
done

echo ""
echo "6. Checking service status..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "========================================="
echo "  Deployment complete!"
echo ""
echo "  Web:  https://${DOMAIN:-localhost}/"
echo "  API:  https://${DOMAIN:-localhost}/api/"
echo ""
echo "  Logs: docker compose -f docker-compose.prod.yml logs -f"
echo "========================================="
