# ADR-0007: USSD production hardening and stable notification routing

- Status: Accepted
- Date: 2026-08-14
- Decision maker: Owner + Platform Council
- Context: The USSD channel is live against the Dar es Salaam tenant but its carrier callback endpoint was unauthenticated and unvalidated (anyone could drive sessions, feed oversized payloads, or replay arbitrary text), the in-browser simulator was always reachable, and abandoned sessions were never cleaned up. Notification delivery, meanwhile, was a single code path that would drop messages entirely if the in-app store or an SMS provider failed. Engagement L4 requires the USSD channel to be safe to expose to a carrier gateway and notification routing to degrade gracefully per channel.
- Options considered:
  1. **Hardcode the carrier callback as open (status quo)** — fastest, but no gateway authentication, no input limits, and no cleanup. Rejected.
  2. **Gate the callback with a shared secret + validate inputs + gate the simulator + scheduled session cleanup (chosen)** — the callback requires a constant-time-compared `x-ussd-secret` header when `USSD_CALLBACK_SECRET` is configured, phone/text are validated (`USSD_PHONE_PATTERN`, `USSD_TEXT_MAX_LENGTH=200`), the simulator route 404s unless `USSD_SIMULATE_ENABLED` resolves true, and a `@Cron(EVERY_6_HOURS)` job purges expired sessions. When the secret is left unset (dev environments only) the endpoint stays open but logs a prominent one-time warning.
  3. **Full carrier HTTPS mTLS + signed payloads** — strongest, but the aggregator doesn't support it; deferred to L5.
  4. **Single notification path that rethrows on failure (status quo)** — an SMS provider outage would take down in-app delivery too. Rejected.
  5. **`NotificationRouterService` with per-channel isolation and optional lazy SMS (chosen)** — the router always delivers the in-app notification (via `NotificationsService.create` with push), and, when a phone is present, invokes a lazily-built SMS closure; each channel is wrapped in its own try/catch and logs without throwing, so one channel's failure never prevents the others or the caller. Order notifiers (`notifyCustomerStatusChanged`, new `notifyVendorPaid`) route through it.
- Decision:
  1. **USSD gateway authentication.** `UssdController` reads `x-ussd-secret`; when `USSD_CALLBACK_SECRET` is configured it must match via `timingSafeEqual` or the request is rejected with 401. Unconfigured ⇒ unauthenticated + one-time warning (dev only).
  2. **USSD request validation.** `assertValidRequest` requires a non-empty `sessionId`, a phone matching `^\+?[1-9][0-9]{6,14}$`, and `text` ≤ 200 chars.
  3. **Simulator gating.** `POST /api/ussd/simulate` returns 404 unless `USSD_SIMULATE_ENABLED` resolves true (`''` ⇒ non-production only; `'true'`/`'1'` force on; `'false'`/`'0'` force off). The web simulator sends the same gateway secret from `VITE_USSD_SIMULATE_SECRET` when set.
  4. **Session lifecycle.** `UssdSessionCleanupService` runs every 6 hours and calls `sessions.cleanupExpired()`.
  5. **Notification routing.** `NotificationRouterService.route({ tenantId, userId, title, message, type, referenceId?, referenceType?, push?, sms? })` delivers in-app (+push) always and SMS only when an `sms` closure is provided; each channel fails independently and never throws. `OrderNotifierService` was refactored onto it and gained `notifyVendorPaid`.
  6. **Configuration.** `env.schema.ts` declares `USSD_CALLBACK_SECRET` and `USSD_SIMULATE_ENABLED`; `AppConfigService.ussd` exposes `{ callbackSecret, simulateEnabled }` with test coverage.
- Consequences:
  - The carrier callback is safe to expose publicly: wrong/missing secret ⇒ 401, malformed payloads ⇒ 400, oversized text rejected, simulator hidden in production.
  - Abandoned USSD sessions no longer accumulate unbounded (6-hour purge).
  - Notifications become resilient: in-app/push delivery no longer depends on the SMS provider, and vice versa; failures are logged per channel.
  - New notification types (vendor payments, etc.) are one call-site away from the router.
  - Operators must set `USSD_CALLBACK_SECRET` and keep `USSD_SIMULATE_ENABLED` false in `.env.production` (and rebuild the web bundle with `VITE_USSD_SIMULATE_SECRET` if the simulator is wanted in a non-prod build).
- Constitution check: Security principle 6.3 fail-closed defaults (Ch6), tenancy isolation preserved (Ch2), observability per channel (Ch7), and graceful degradation of a live commercial channel (Ch8 continuity posture).
