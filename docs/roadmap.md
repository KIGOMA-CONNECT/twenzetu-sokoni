# AfriMarket Platform Roadmap

A living document. Updated at every release or milestone; the current maturity posture is recorded here and reviewed quarterly by the Platform Council (Constitution, Chapter 8).

## Maturity model

Every platform is measured on the L0–L7 scale defined in [Constitution, Chapter 10](constitution/10-the-future.md#102-maturity-levels):

| Level | Name |
|---|---|
| L0 | Concept |
| L1 | Architecture Approved |
| L2 | Domain Model Complete |
| L3 | APIs Complete |
| L4 | Production Ready |
| L5 | Enterprise Certified |
| L6 | AI Enhanced |
| L7 | Marketplace Ready |

Level changes are [recorded decisions](adr/README.md) with evidence.

## Current posture (2026-08-19)

| Platform | Level | Status / next step to advance |
|---|---|---|
| Marketplace | **L4** | Live at `twenzetusokoni.com`. Next: L5 — audit trail review, SLAs, enterprise support. |
| Core Platform (tenancy, audit, finance, queue, tracing, security) | **L4** | Operational. Next: published standards for suite integration. |
| Identity | **L4** | AuthN/AuthZ live; self-service account management (profile edit, change password with cross-device revocation, signed-in device management, self-service deactivation) + SMS-OTP account recovery with rate limiting and anti-enumeration. Next: SSO readiness → L5. |
| Engagement (web, Android/TWA, USSD) | **L4** | USSD hardened (gateway secret, input validation, simulator gating, session cleanup) + stable notification routing (ADR-0007); Beem USSD Hub integration live (`/api/ussd/beem/callback`, raw-response adapter, engine exit semantics) (ADR-0008); **native push via Firebase Cloud Messaging** (`fcm_token` on `push_subscriptions`, legacy FCM sender) alongside VAPID web push, and **Google Maps embeds on vendor storefronts** (`GET /public/maps-key` + storefront iframe). Next: L5 — cross-suite engagement analytics, campaign tooling. |
| Payments | **L2** | AzamPay aggregator built (M-Pesa, YAS/Mixx, Airtel Money, HaloPesa, T-Pesa, AzamPesa) + webhooks + wallets + **card checkout wired end-to-end** (ADR-0004, commit `6865bc1`). Blocked on the **AzamPay production API key** + `AZAMPAY_CARD_SUCCESS_URL`/`AZAMPAY_CARD_FAIL_URL` in `.env.production`; then verify all MNO + card methods (see [payments-readiness](payments-readiness.md)). |
| Cargo, Express & Logistics | **L4** | Binding server-side fare engine (`CargoFareCalculator`), instant booking with wallet/card/mobile-money/cash, `READY_FOR_PICKUP` auto-promotion (ADR-0005); L4 hardening shipped — server-derived driver earnings, capacity-aware auto-dispatch, delivery ETA, OTP-confirmed completion, consumer "Rate Driver" from Order History (commit `397e041` + `Rate Driver`), pickup-OTP confirmation for driver handoff (pickup code shown to vendor, driver enters it to mark PICKED_UP, commit `0735d5b`); **real delivery distance/ETA populated on every delivery** (`distance_km`/`estimated_time_minutes`) via Google Maps Distance Matrix with straight-line fallback (`DeliveryRouteEstimator`, wired into create/assign/auto-dispatch); **delivery SLA dashboards shipped** (on-time rate vs estimated ETA, avg actual vs estimate, per-driver SLA breakdown in the admin console). Next: L5 — driver app offline mode, bulk fleet ops. |
| Marketing & Growth | **L4** | Tenant-managed category marketing data (tagline/benefits/emoji), public tenant-aware `/api/public/ads` + `/api/public/catalog`, in-app Matangazo page with copyable share links, public read-only browse pages, landing-page discovery, static OpenGraph/social cards (ADR-0006); SMS campaign broadcasts (create/list/launch with send/failure accounting, capped audience) + per-tenant category copy management (`PATCH /categories/:id/marketing`) + vendor marketing console (`/vendor/marketing`) (ADR-0009). L4 shipped: **scheduled campaigns auto-dispatched by a background scheduler** (`CampaignDispatchService`, `@Cron` every minute) and **audience segmentation** (`segment` JSONB: min delivered orders / last-order window) in the vendor console (commit `6b57f55`). WhatsApp channel awaits a provider (same dependency as SMS L4 keys). |
| Analytics | **L4** | Metrics exposed (`/api/metrics`) + monitoring stack; tenant-facing reports (vendor + admin consoles: sales summary, daily series, order funnel, customer acquisition, delivery performance, **delivery SLA**, top products, inventory, metric catalog) with CSV export, a documented metric catalog (`docs/analytics/metric-catalog.md`) and **self-service custom date ranges** (`from`/`to` overrides for every report). Next: cross-suite analytics → L5. |
| AI | **L0** | Concept. Next: charter + use cases (recommendations, forecasting). |
| Cloud | **L0** | Concept. Next: managed hosting proposition for tenants. |
| Developer Portal | **L0** | Concept. Next: API reference + key management → L1. |
| API Gateway | **L0** | Concept. Next: single public entry + rate limiting → L1. |
| Documentation | **L1** | This repo's `docs/` + Constitution ratified. Next: published site → L2. |
| Learning | **L0** | Concept. Next: academy charter (see [engineering-institute](engineering-institute.md)). |
| Community | **L0** | Concept. Next: support + feedback channels. |

## Milestones

### Horizon 1 — Prove (2026–2027)
- [ ] **Payments L4** — receive AzamPay production API key; set `AZAMPAY_*` + `AZAMPAY_CARD_SUCCESS_URL`/`AZAMPAY_CARD_FAIL_URL`; activate and verify all MNO + card methods; reconciliation verified. (See [payments-readiness](payments-readiness.md).)
- [ ] **Cargo, Express & Logistics L5** — driver app offline mode, delivery SLA dashboards, bulk fleet ops. (L4 shipped: driver earnings, capacity dispatch, ETA, delivery + pickup OTP, consumer driver ratings; SLA dashboards shipped: on-time rate vs estimated ETA, per-driver SLA breakdown, admin analytics tab.)
- [ ] **Marketing & Growth L5** — WhatsApp campaign channel (once a provider is onboarded), cross-channel analytics, A/B message testing. (L4 shipped: SMS campaigns, vendor console, scheduling/queue + audience segmentation, ADR-0009 + commit `6b57f55`.)
- [ ] **SMS L4** — obtain and configure an SMS provider (Africa's Talking / Twilio / Termii) for OTP delivery in production.
- [x] **Engagement L4** — USSD production hardening; notification routing stable; Beem USSD Hub integration live. (ADR-0007, ADR-0008)
- [x] **Analytics L2/L3** — tenant-facing reports; defined metric catalog. (Vendor + admin analytics consoles with overview/funnel/customers/deliveries/top products/inventory, CSV export, documented [metric catalog](analytics/metric-catalog.md).)
- [x] **Analytics L4** — self-service dashboards for tenants. (Custom `from`/`to` date ranges on every report in the admin console; delivery SLA report; documented metric catalog.)
- [x] **Identity L4** — self-service account management; account recovery. (Profile edit, change password with session revocation, signed-in device management, self-service deactivation `POST /auth/me/deactivate`, SMS-OTP forgot/reset password with rate limiting + anti-enumeration.)
- [x] **Google Maps + native push** — delivery distance/ETA via Google Maps Distance Matrix (with haversine fallback), Firebase Cloud Messaging native push channel alongside VAPID web push, and Google Maps embeds on vendor storefronts.
- [x] **Enterprise Certification baseline (L5 readiness)** — audit trail completeness review, backup/DR runbooks verified, compliance review (PECA 2018/2022). (Baseline shipped: audit trail wiring for admin vendor approve/suspend + coverage matrix and remediation plan, `verify-backup-restore.sh` DR drill script, `docs/compliance/enterprise-readiness.md` + `institutional-tenant-onboarding.md` + `verify-tenant.sh`; open gaps tracked in the readiness doc.)
- [ ] **First institutional tenants** — multi-tenant onboarding verified with a real second tenant. (Runbook + verification tooling ready; execution requires a signed DPA — see [institutional-tenant-onboarding](compliance/institutional-tenant-onboarding.md).)
- [ ] **Engineering Institute charter** — first internal training track ("AfriMarket Platform Fundamentals").
- [ ] **Design system (Part B)** — token + component proposal shipped ([`docs/design/design-system.md`](design/design-system.md)); **component sweep shipped** (2026-08-20: spacing/motion tokens + `prefers-reduced-motion` in `globals.css`; hardcoded hex → token refactor across ~50 admin/vendor/consumer pages; `:focus-visible` rings; new Skeleton + Toast components; mobile bottom-sheet modals; input `aria-invalid` states). Pending: dark mode surface mapping, remaining component-state polish.
- [ ] **Vendor Capital / merchant financing (Part C)** — design study shipped ([`docs/finance/vendor-capital.md`](finance/vendor-capital.md)): offer-driven advances, %-of-settlement auto-deduction on the payout rail, flat-fee pricing, data-driven credit-score recompute, admin/audit wiring. P0–P4 rollout phases defined; fee/rate table pending production-data validation.

### Horizon 2 — Scale (2028–2030)
- [ ] Developer Portal L4 — API keys, docs, sandbox for partners.
- [ ] API Gateway L4 — governed public entry point.
- [ ] Identity L5 — SSO across suites.
- [ ] Marketplace L7 — open to third-party sellers as a governed platform.
- [ ] Learning & Community live (L3+).

### Horizon 3 — Lead (2031–2035)
- [ ] AfriMarket Cloud L4 — managed hosting for tenants.
- [ ] AI L6 across suites — recommendations, forecasting, support intelligence.
- [ ] Documentation as a living system (L4+).
- [ ] Recognized as a world-leading African enterprise platform (Vision 2035).

## How to update this file

1. Advance a platform level only with evidence (release notes, metrics, or a test report).
2. Reference the ADR that records the level change.
3. Keep the "Current posture" table in sync with the latest release.
4. Update after every significant release and at the quarterly platform review.
