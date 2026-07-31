#!/bin/bash
set -e

DOMAIN="${1:-}"
EMAIL="${2:-admin@${DOMAIN}}"

echo "========================================="
echo "  afriMarket SSL Certificate Setup"
echo "========================================="

if [ -z "$DOMAIN" ]; then
  echo ""
  echo "USAGE: ./setup-ssl.sh yourdomain.com [admin@yourdomain.com]"
  echo ""
  echo "  First argument:  Your production domain (required)"
  echo "  Second argument: Email for Let's Encrypt (optional, defaults to admin@domain)"
  echo ""
  echo "  For local/dev, use: ./generate-ssl.sh"
  exit 1
fi

echo ""
echo "Domain: $DOMAIN"
echo "Email:  $EMAIL"
echo ""

# Step 1: Install certbot if not present
if ! command -v certbot &> /dev/null; then
  echo "Installing certbot..."
  apt-get update -qq && apt-get install -y -qq certbot python3-certbot-nginx 2>/dev/null || \
    yum install -y certbot python3-certbot-nginx 2>/dev/null || \
    echo "WARNING: Could not install certbot. Install it manually: https://certbot.eff.org/"
fi

# Step 2: Create SSL directory
mkdir -p docker/nginx/ssl

# Step 3: Stop nginx if running via Docker
echo "Stopping any running nginx container..."
docker compose -f docker-compose.prod.yml stop nginx 2>/dev/null || true

# Step 4: Issue certificate
echo ""
echo "Requesting Let's Encrypt certificate for $DOMAIN..."
sudo certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --domains "$DOMAIN" \
  --cert-name "$DOMAIN" \
  --keep-until-expiring \
  --preferred-challenges http

# Step 5: Copy certs to nginx ssl directory
echo ""
echo "Copying certificates to docker/nginx/ssl/..."
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
if [ -d "$CERT_DIR" ]; then
  sudo cp "$CERT_DIR/fullchain.pem" docker/nginx/ssl/
  sudo cp "$CERT_DIR/privkey.pem" docker/nginx/ssl/
  sudo chmod 644 docker/nginx/ssl/fullchain.pem
  sudo chmod 600 docker/nginx/ssl/privkey.pem
  sudo chown "$USER:$USER" docker/nginx/ssl/*.pem
  echo "Certificates copied."
else
  echo "ERROR: Certificate directory not found at $CERT_DIR"
  echo "Check certbot output above."
  exit 1
fi

# Step 6: Set up auto-renewal (systemd timer + post-hook to copy certs)
echo ""
echo "Setting up auto-renewal..."

# Create renewal hook to copy certs to Docker volume
HOOK_DIR="/etc/letsencrypt/renewal-hooks/post"
sudo mkdir -p "$HOOK_DIR"
sudo tee "$HOOK_DIR/afri-market-copy.sh" > /dev/null << EOF
#!/bin/bash
# Copy renewed certs to afriMarket nginx ssl directory
DEPLOY_DIR="$(pwd)/docker/nginx/ssl"
cp "$CERT_DIR/fullchain.pem" "\$DEPLOY_DIR/"
cp "$CERT_DIR/privkey.pem" "\$DEPLOY_DIR/"
chmod 644 "\$DEPLOY_DIR/fullchain.pem"
chmod 600 "\$DEPLOY_DIR/privkey.pem"
# Reload nginx to pick up new certs
cd "$(pwd)" && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload 2>/dev/null || true
EOF
sudo chmod +x "$HOOK_DIR/afri-market-copy.sh"

# Test renewal
echo ""
echo "Testing renewal process..."
sudo certbot renew --dry-run

echo ""
echo "========================================="
echo "  SSL Setup Complete!"
echo ""
echo "  Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  Auto-renewal hook: $HOOK_DIR/afri-market-copy.sh"
echo "  Renewal schedule: Twice daily via systemd timer (certbot.timer)"
echo ""
echo "  To renew manually: sudo certbot renew"
echo "========================================="
