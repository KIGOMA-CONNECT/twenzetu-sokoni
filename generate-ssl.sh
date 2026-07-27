#!/bin/bash
set -e

SSL_DIR="docker/nginx/ssl"
mkdir -p "$SSL_DIR"

echo "Generating self-signed SSL certificate for development..."
echo "For production, use Let's Encrypt: certbot --nginx -d yourdomain.com"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_DIR/privkey.pem" \
  -out "$SSL_DIR/fullchain.pem" \
  -subj "/C=TZ/ST=Dar es Salaam/L=Dar es Salaam/O=afriMarket/CN=localhost"

echo "Certificate generated in $SSL_DIR/"
echo "  - fullchain.pem (certificate)"
echo "  - privkey.pem (private key)"
