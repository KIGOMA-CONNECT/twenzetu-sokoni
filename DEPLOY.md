# Production Deployment Checklist — twenzetusokoni.com

## Pre-deploy (one-time)

- [ ] Run migration on production DB:
  ```bash
  docker compose -f docker-compose.prod.yml exec api npx typeorm migration:run -d libs/database/src/lib/config/build-data-source-options.ts
  ```
- [ ] Ensure all env vars are set on the production server (see below)
- [ ] Verify SSL certs are valid and not expiring soon:
  ```bash
  docker compose -f docker-compose.prod.yml exec nginx openssl x509 -enddate -noout -in /etc/nginx/ssl/fullchain.pem
  ```

## Required env vars

```
# Security (app won't start without these in production)
JWT_SECRET=<random-64-chars>
PAYMENT_CONFIRM_SECRET=<random-64-chars>
WEBHOOK_INTERNAL_SECRET=<random-64-chars>
METRICS_SECRET=<random-64-chars>

# CORS
CORS_ORIGINS=https://twenzetusokoni.com

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=afri_market
DB_OWNER_USER=<set-in-.env>
DB_OWNER_PASSWORD=<set-in-.env>
DB_RUNTIME_USER=<set-in-.env>
DB_RUNTIME_PASSWORD=<set-in-.env>
DB_POOL_MAX=20
DB_POOL_MIN=2

# Redis
REDIS_URL=redis://redis:6379

# App
APP_ENV=production
APP_PORT=3000
NODE_ENV=production
```

## Deploy steps

```bash
# 1. Push to master (auto-deploy via cron)
git push origin master

# 2. Wait for CI gate to pass (GitHub Actions)
# 3. Cron job pulls and deploys within 60 seconds

# OR manual deploy:
ssh production-server
cd /opt/twenzetu-sokoni
git pull origin master
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec api npx typeorm migration:run -d libs/database/src/lib/config/build-data-source-options.ts
```

## Post-deploy verification

- [ ] Health check: `curl -s https://twenzetusokoni.com/health` → `ok`
- [ ] API responds: `curl -s https://twenzetusokoni.com/api/v1/health` → `ok`
- [ ] WebSocket connects: open browser console, check Socket.IO connection
- [ ] Login works: create account, receive OTP, login
- [ ] Vendor POS: create product, process sale
- [ ] Consumer flow: browse, add to cart, checkout
- [ ] Delivery flow: accept delivery, update status
- [ ] Payments: process mobile money payment
- [ ] Admin: login, view dashboard, manage users

## Rollback

```bash
# If something breaks, revert to previous commit
ssh production-server
cd /opt/twenzetu-sokoni
git log --oneline -5  # find last good commit
git checkout <commit-hash>
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## Monitoring

- Grafana: `https://grafana.twenzetusokoni.com` (if configured)
- Logs: `docker compose -f docker-compose.prod.yml logs -f api`
- DB: `docker compose -f docker-compose.prod.yml exec postgres psql -U postgres afri_market`
