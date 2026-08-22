# Performance & Scalability Audit

Audit date: 2026-08-19/20 · Status: baseline findings + remediation plan

Scope: API request frequency, database queries, caching strategy, compute model,
real-time subscriptions, pagination, rate limiting, logging, and bandwidth. Each section
ends with recommended actions ranked by impact.

## 0. Headline

The platform runs at **very low load today** (≈29k requests/day, ≈130 MB/day out; API at
~1% CPU, 77 MiB RAM) — the current single-VM container stack is more than adequate. The
findings below are about **scalability headroom and resilience**, not imminent capacity
problems. One item is critical: the stack had no self-healing and a broken alert path, which
caused a silent ~9h outage on 2026-08-19 (see §8).

## 1. API request frequency & bandwidth

| Metric | Value |
| --- | --- |
| Requests/day (web domain) | ~29k (nginx `twenzetusokoni.com.log`) |
| Egress bandwidth | ~130 MB/day |
| Peak patterns | `/api/notifications?limit=20` and `/api/notifications/unread-count` each hit 627× in the last 2k requests — the web app polls these every 30s per authenticated user (`NotificationContext.tsx`) |
| Status mix (last 2k) | 93.5% 200 · 4% 502 · 0.55% 500 |
| 5xx origin | 502s were during deploys/outage; the 500s were our own unauthenticated tenant-scoped probes (tenant middleware throws before the auth guard) |

**Action (P2):** replace the 30s notification polling with a push over the existing
Socket.IO gateway (`notifyUser` already exists) — removes 2 queries/user/30s and most of the
recurring request volume.

## 2. Database queries

- **Analytics** runs 5–6 uncached aggregate scans per request (hand-written SQL in
  `analytics.service.ts`): `salesSummary`, `dailySeries`, `orderFunnel`, `customerAcquisition`
  (3 sub-queries + `MIN(created_at)` group-by), `deliveryPerformance`, `topProducts`.
- **Missing index:** `orders (tenant_id, created_at)` — analytics range scans and recent-orders
  sort have only `(tenant_id, vendor_id)` and `(status, created_at)` indexes.
- **N+1:** `checkout-cart.use-case.ts` loops per cart item calling `productRepo.findById`
  one-by-one; `order-notifier.service.ts` queries per event.
- **Checkout is not transactional:** cart-claim → order INSERT → payment INSERT → items →
  stock UPDATE with manual compensation; partial-failure windows exist.
- **RLS:** policies exist but **`rowsecurity` is disabled** on all tables (verified in prod).
  Isolation relies entirely on app-layer `tenant_id` filters.

**Actions:** (P1) add `(tenant_id, created_at)` indexes on `orders` and `deliveries`;
(P2) batch the checkout product lookups with a single `IN (...)` query; (P3) wrap checkout in
a transaction; (P3) decide deliberately whether to enable RLS or document the app-layer
isolation model as the security control.

**RLS decision (made 2026-08-21):** keep app-layer tenant isolation as the security
control; RLS stays disabled. Rationale: every repository query is tenant-scoped via a
mandatory resolved `tenantId`, and enabling RLS properly would require dedicated non-owner
DB roles plus a `SET app.tenant_id` GUC plumbed through every TypeORM connection — a
cross-cutting migration with real regression risk and no current threat driver (single API
owns the DB; tenants have no direct DB access). Revisit when any of these become true:
(a) external/BI consumers get direct DB access, (b) per-tenant DB credentials are
introduced, (c) a compliance framework demands defense-in-depth at the storage layer.

## 3. Caching strategy

- Redis is provisioned and wired, **but there is effectively no read caching**:
  - `CacheModule.registerAsync` with a 5-min TTL and `createKeyv(redisUrl)` is registered
    (`libs/tenancy/src/lib/redis-cache.module.ts`).
  - **Zero** `CacheInterceptor` usages. Products, catalog, categories, ads, and analytics are
    re-computed against Postgres on every request.
  - The only cache *writes* are OTPs (`otp:{phone}`, 5-min TTL) and rate-limit counters.
  - A `CacheInvalidationInterceptor` flushes the **entire Redis cache** on marketplace writes
    — a no-op today because nothing is ever cached.
- No HTTP caching headers on the static web build (`main.ts` serves `dist` with no
  `Cache-Control`).

**Actions:** (P1) add `CacheInterceptor`/`@CacheTTL` on the hot read-only endpoints (public
products/vendors/categories, catalog, ads) with a short TTL; (P2) replace the blanket
`cacheManager.reset()` with key-prefixed invalidation; (P3) add hashed-asset cache headers in
the web nginx.

## 4. Compute model (serverless)

- **Not serverless:** a single containerized NestJS API (`node:20-alpine`) + postgres + redis
  on one VM via `docker-compose.prod.yml` (api on `127.0.0.1:3300`, web on `3301`). No
  lambdas/vercel/serverless functions anywhere.
- Current idle CPU/RAM: API 1.2% CPU / 77 MiB; postgres 1.5% / 36 MiB; redis 0.4% / 5 MiB.
- Horizontal scaling today would require moving the throttler store to Redis and adding a
  load balancer (both are cheap; neither is needed at current volume).

## 5. Real-time subscriptions

- Socket.IO gateway (`/marketplace`, path `/api/socket.io`): JWT-verified handshake, rooms
  `tenant:{id}` / `user:{id}` / `order:{id}`; events `order-update`, `new-order`,
  `delivery-update`, `delivery-status-changed`, `dispute-created`, `payment-confirmed`,
  `notifyUser`.
- **Fan-out concern:** `new-order` and `dispute-created` emit to the entire tenant room
  (`gateway.ts:117,138`) — O(tenant users) per event; no server-side per-vendor filter.
- **Bug:** client sends `authenticate {userId, tenantId}` but the server expects `data.token`
  (`useSocket.ts:29` vs `gateway.ts:78`) — the event always fails; connections still work
  because rooms are joined during handshake.
- `maxHttpBufferSize` is default (~1 MB); drivers push location every 10s.

**Actions:** (P2) fix the `authenticate` contract mismatch; (P2) scope `new-order`/dispute
emits to the relevant user room instead of the whole tenant; (P3) lower `maxHttpBufferSize`.

## 6. Pagination

- Shared util clamps `limit` to `[1,100]`, default 20, **OFFSET-based** (`skip`/`offset`) —
  degrades at deep offsets (no keyset pagination anywhere).
- **Unbounded queries (no LIMIT):** `GET /products?vendorId`, `GET /public/products?vendorId`,
  `GET /deliveries/driver/:id`, and `GET /orders` (fetches all customer orders then slices in
  memory — `orders.controller.ts:126`).
- **Uncapped limit:** `GET /notifications` (`Number(limit) || 50`, accepts `limit=100000`);
  driver reviews unclamped.

**Actions:** (P1) cap `GET /notifications` and clamp the driver-review limit; (P2) push the
`/orders` filter/sort into SQL (drop the in-memory slice) and add LIMIT; (P2) add LIMIT to
`findByVendorId`/`findByDriverId`; (P3) keyset pagination on the largest tables when they grow.

## 7. Rate limiting

- Global `ThrottlerGuard` = **300 req/min** (`app.module.ts`), now backed by
  **Redis** (`ThrottlerRedisStorage`) — limits survive restarts and are shared across replicas.
- Per-route caps: register-tenant 3/min, send-otp 2/min, login 20/min, register 10/min,
  orders/checkout 10/min, admin class 30/min, USSD class 600/min. `@SkipThrottle` on
  health/metrics.
- The old `PerUserRateLimitGuard`/`StrictRateLimitGuard` were **removed** (2026-08-21):
  they were dead code with a non-atomic get-then-set race. Their purpose (identity/IP-based
  caps on sensitive routes) is fully covered by the per-route `@Throttle` overrides, which
  now count atomically in Redis through the shared storage — one rate-limiting system
  instead of two competing ones.

**Actions:** (P1) ~~move the throttler store to Redis~~ **Done**; (P2) ~~enable the per-user
Redis guards~~ **Resolved by removal** — per-route `@Throttle` caps are Redis-backed and atomic.

## 8. Logging

- Logger: custom `AppLoggerService` wrapping **pino**, JSON to stdout in production at level
  `info`.
- **Per-request logs are suppressed in production** — `RequestLoggingInterceptor` logs at
  DEBUG, prod level is INFO. No rotation, no shipping, no aggregation.
- Docker `logs` is the only sink (default json-file driver, no max-size).

**Actions:** (P2) log requests at INFO with a `?debug` escape hatch; (P2) add
`logging: { driver: json-file, options: { max-size, max-file } }` to the api service; (P3)
ship pino JSON to an aggregator.

## 9. Operational resilience (found during this audit)

On 2026-08-19 the **whole stack was stopped cleanly** (`docker compose stop`) and stayed down
~9 hours with no alert and no self-healing:

- The container restart policy is `unless-stopped` — it does **not** restart a stack that was
  explicitly stopped.
- The 2-min `auto-deploy` cron only deploys on new pushes; it does not check stack health.
- `monitor.sh` detected nothing (it only checks web/API/backup and logs OK) — but the
  alerting path was also broken: `mail.py` had **no shebang**, so bash mis-executed the Python
  script and every alert silently failed.
- The crontab had been reduced to a single entry, dropping the monitor, auto-deploy, and
  daily-backup jobs; the DB backup went **28h stale**.

**Fixed during this audit:**

- Restarted the stack (`docker compose --env-file .env.production up -d`) — all containers
  healthy, web/API 200.
- Restored the three crons (monitor `*/10`, auto-deploy `*/2`, backup `30 2`).
- Fixed `mail.py` shebang (`#!/usr/bin/env python3`) and verified it compiles.
- Ran a fresh backup immediately; confirmed the **off-site Google Drive upload works**.
- Replaced `monitor.sh` with a **self-healing** version (`scripts/monitor.sh`): if web or API
  is down it restarts the stack, re-checks, and reports recovery in the alert. This file is
  now versioned in the repo.

**Remaining (P1):** none blocking — self-healing + alerts are now in place. (P2) ~~daily
backup status to the alert email~~ **Done (2026-08-21)** — `backup-db-prod.sh` now emails a
daily `BACKUP OK` confirmation, a `BACKUP DEGRADED` alert when off-site uploads fail or are
skipped, and a `BACKUP FAILED` alert via an ERR trap if the dump itself dies; it reuses the
monitor.sh SMTP channel and is a no-op when the host has no SMTP config. Consider (P3)
moving postgres backups off-host beyond gdrive (S3 bucket configured via `BACKUP_S3_BUCKET`).

## Priority summary

| Priority | Item | Status |
| --- | --- | --- |
| P1 | `orders (tenant_id, created_at)` index | **Done** — migration `1700000000046` adds it for orders + deliveries |
| P1 | Redis throttler store | **Done** — custom `ThrottlerRedisStorage` (atomic INCR/PTTL, shadow block key) wired into `ThrottlerModule.forRoot` in app.module.ts; limits now survive restarts and are shared across replicas. The v6 multi-throttler collapse bug remains documented — keep using a single named throttler + `@Throttle` overrides |
| P1 | Cache hot read endpoints (public products/vendors/catalog/ads) | **Done** — `CacheInterceptor` on `PublicController` with per-route TTLs (ads/vendors/products 60s, catalog/categories 5min, rest default 5min); served from the existing Redis store; mutations still flush via CacheInvalidationInterceptor |
| P1 | Cap `GET /notifications` limit; clamp driver reviews | **Done** — limit clamped to [1,100] in notifications.controller.ts; driver reviews were already paginated |
| P1 | Notification push over Socket.IO instead of 30s polling | **Done** — `NotificationsService.create` now emits `notification` to the user's socket room; client subscribes and drops polling to a 5-min fallback while connected (60s when offline) |
| P2 | Fix gateway `authenticate` contract; scope tenant-room fan-out | **Done** — client sends `{ token }` per server contract; `dispute-created` now emits only to the customer + vendor user rooms; the dead tenant-wide `notifyVendorOrder` was removed (order flows already used the vendor-scoped `notifyNewOrder`). No frontend listened to either event, so nothing breaks |
| P2 | Transactional checkout + batched product lookups | **Done** — both order paths now do one batched `findByIds` lookup, one multi-row `order_items` INSERT, and claim stock inside `ds.transaction` with guarded atomic UPDATEs *before* any order rows are written. The remaining compensation logic covers only external payment-initiation failure (STK push), which by design cannot live inside a DB transaction — this matches the industry saga pattern rather than a single mega-transaction |
| P2 | SQL-side ordering + LIMIT on `/orders`, `findByVendorId`, `findByDriverId` | **Done** — `findByCustomerId` paginated in SQL with status filter + total count; deliveries-by-driver uses paginated `findByTenantAndDriver`; `findByVendorId` products capped at 500 |
| P2 | Request logging at INFO; log rotation/max-size on containers | **Done** — `RequestLoggingInterceptor` now logs every request at INFO (health/metrics probes stay DEBUG to avoid monitor.sh spam); `logging: json-file max-size 10m / max-file 3` added to all services in docker-compose.prod.yml (host must `docker compose up -d` to apply). Local stray logs (`web-lint7.log`, 35MB `.nx/daemon.log`) deleted |
| P2 | Savings/loan decimal arithmetic corruption (`"0.00" + amount` string concat on pg NUMERIC reads) | **Done** — `decimalNumber` ValueTransformer applied to all core-finance decimal columns; fixes savings deposits recording balance 0 and loan `totalRepaid +=` corruption |
| P3 | Keyset pagination; pre-aggregated analytics; RLS | **Decided/closed** — HTTP Cache-Control shipped earlier; per-user rate-limit guards resolved by removing the dead non-atomic guards (per-route `@Throttle` caps are Redis-backed and atomic); RLS decision documented in §2 (app-layer isolation is the control, with explicit revisit triggers); keyset pagination + pre-aggregated analytics remain deliberately deferred until table size/load demands them |

### Also fixed during this pass (ops, 2026-08-21)

- Backup alerting: `scripts/backup-db-prod.sh` sends daily success confirmations,
  degraded-upload alerts, and failure alerts through the same SMTP channel as monitor.sh.

### Also fixed during this pass (vendor console production-readiness)

- Stale cached user objects without `role` rendered "(undefined)" in the sidebar;
  hydration now requires a complete user record and the label falls back safely.
- Sidebar navigation grouped into Marketplace / Vendor Panel / Admin Panel /
  Driver Panel / Account sections so vendor catalogue, settings and reports are
  discoverable (they existed but were visually lost in one flat list).