#!/bin/bash
# copy-cert.sh <le-cert-name> <target-dir> : copy renewed cert to BT-served dir + reload nginx
set -e
SRC=/etc/letsencrypt/live/$1
DST=$2
mkdir -p "$DST"
cp -f "$SRC/fullchain.pem" "$DST/fullchain.pem"
cp -f "$SRC/privkey.pem" "$DST/privkey.pem"
chmod 644 "$DST/fullchain.pem"
chmod 600 "$DST/privkey.pem"
/www/server/nginx/sbin/nginx -t >/dev/null 2>&1 && /www/server/nginx/sbin/nginx -s reload
echo "$(date '+%F %T') copied $1 -> $DST and reloaded nginx"
