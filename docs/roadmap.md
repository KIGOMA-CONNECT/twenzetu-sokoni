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

## Current posture (2026-08-18)

| Platform | Level | Status / next step to advance |
|---|---|---|
| Marketplace | **L4** | Live at `twenzetusokoni.com`. Next: L5 — audit trail review, SLAs, enterprise support. |
| Core Platform (tenancy, audit, finance, queue, tracing, security) | **L4** | Operational. Next: published standards for suite integration. |
| Identity | **L3** | AuthN/AuthZ live. Next: self-service account, SSO readiness → L4. |
| Engagement (web, Android/TWA, USSD) | **L4** | USSD hardened (gateway secret, input validation, simulator gating, session cleanup) + stable notification routing (ADR-0007); Beem USSD Hub integration live (`/api/ussd/beem/callback`, raw-response adapter, engine exit semantics) (ADR-0008). Next: L5 — cross-suite engagement analytics, campaign tooling. |
| Payments | **L2** | AzamPay aggregator built (M-Pesa, YAS/Mixx, Airtel Money, HaloPesa, T-Pesa, AzamPesa) + webhooks + wallets + **card checkout wired end-to-end** (ADR-0004, commit `6865bc1`). Blocked on the **AzamPay production API key** + `AZAMPAY_CARD_SUCCESS_URL`/`AZAMPAY_CARD_FAIL_URL` in `.env.production`; then verify all MNO + card methods (see [payments-readiness](payments-readiness.md)). |
| Cargo, Express & Logistics | **L3** | Binding server-side fare engine (`CargoFareCalculator`), instant booking with wallet/card/mobile-money/cash, `READY_FOR_PICKUP` auto-promotion (ADR-0005); L4 hardening shipped — server-derived driver earnings, capacity-aware auto-dispatch, delivery ETA, OTP-confirmed completion, consumer "Rate Driver" from Order History (commit `397e041` + `Rate Driver`). Remaining for L4: driver PWA for pickup/delivery OTP. |
| Marketing & Growth | **L3** | Tenant-managed category marketing data (tagline/benefits/emoji), public tenant-aware `/api/public/ads` + `/api/public/catalog`, in-app Matangazo page with copyable share links, public read-only browse pages, landing-page discovery, static OpenGraph/social cards (ADR-0006); SMS campaign broadcasts (`/api/marketing/campaigns` create/list/launch with send/failure accounting, capped audience) + per-tenant category copy management (`PATCH /categories/:id/marketing`) + vendor marketing console (`/vendor/marketing`) (ADR-0009). Next: WhatsApp channel, campaign scheduling/queue → L4. |
| Analytics | **L1** | Metrics exposed (`/api/metrics`) + monitoring stack. Next: tenant-facing reports → L2/L3. |
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
- [ ] **Cargo, Express & Logistics L4** — driver PWA for pickup/delivery OTP (driver earnings, capacity dispatch, ETA, OTP completion and consumer driver ratings shipped).
- [ ] **Marketing & Growth L4** — WhatsApp campaign channel, scheduled/queued delivery, audience segmentation. (SMS campaigns + vendor marketing console shipped with L3, ADR-0009.)
- [ ] **SMS L4** — obtain and configure an SMS provider (Africa's Talking / Twilio / Termii) for OTP delivery in production.
- [x] **Engagement L4** — USSD production hardening; notification routing stable; Beem USSD Hub integration live. (ADR-0007, ADR-0008)
- [ ] **Analytics L2/L3** — tenant-facing reports; defined metric catalog.
- [ ] **Identity L4** — self-service account management; account recovery.
- [ ] **Enterprise Certification baseline (L5 readiness)** — audit trail completeness, backup/DR runbooks verified, compliance review (PECA 2018/2022).
- [ ] **First institutional tenants** — multi-tenant onboarding verified with a real second tenant.
- [ ] **Engineering Institute charter** — first internal training track ("AfriMarket Platform Fundamentals").

### Horizon 2 — Scale (2028–2030)
- [ ] Developer Portal L4 — API keys, docs, sandbox for partners.
- [ ] API Gateway L4 — governed public entry point.
- [ ] Identity L5 — SSO across suites.
- [ ] Marketplace L7 — open to third-party sellers as a governed platform.
- [ ] Learning & Community live (L3+).
- [ ] Analytics L4 — self-service dashboards for tenants.

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
