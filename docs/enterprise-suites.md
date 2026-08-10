# AfriMarket Enterprise Suites

> "Ningepanua afrimarket kuwa na Enterprise Suites badala ya modules za pekee. Muundo huu unafanya mfumo uwe scalable na rahisi kupanuliwa kwa sekta mbalimbali."

Enterprise Suites are the structuring model of the AfriMarket platform. Instead of a growing pile of standalone modules, the platform is organized into named suites — each a boundary for ownership, APIs, and maturity — that compose into one enterprise platform under a single Constitution.

## Why suites instead of modules

| Standalone modules | Enterprise Suites |
|---|---|
| Grow by accretion | Grow by design |
| Duplicate identity, payment, and audit logic | Share the core platform once |
| No clear ownership | Named owners and maturity per suite |
| Hard to open to partners | Each suite can reach "Marketplace Ready" (L7) independently |
| Difficult to measure | Every suite has a measurable maturity level (L0–L7) |

Suites make the platform **scalable** and **easy to extend across sectors** — commerce, transport, logistics, services — without fragmenting the codebase or the experience.

## The suite map

The current monorepo is already the seed of this structure. Suites are the evolution of `libs/` and `apps/`, not a rewrite.

| Suite | Repository seed(s) | Today |
|---|---|---|
| **Core Platform** | `libs/core`, `libs/kernel`, `libs/database`, `libs/core-audit`, `libs/core-finance`, `libs/core-queue`, `libs/core-resilience`, `libs/core-tracing` | Config, exceptions, HTTP, logging, security, audit, finance, queues, resilience, tracing |
| **Tenancy** | `libs/tenancy` | Multi-tenant isolation and per-tenant configuration |
| **Identity Suite** | `libs/identity` | AuthN/AuthZ, users, roles, tenant context (future: SSO, self-service) |
| **Marketplace Suite** | `libs/marketplace` | Products, vendors, orders, services, quotes, transport/cargo requests — the live commerce engine |
| **Engagement Suite** | `libs/ussd`, `apps/web`, `android/` | Channels: web (React SPA), Android TWA + push, USSD |
| **Payments Suite** | `libs/integrations` (finance-aware adapters) | M-Pesa, AzamPay integrations (sandbox → production) |
| **Integrations Suite** | `libs/integrations` | SMS/notifications and external adapters |
| **Applications** | `apps/api`, `apps/web` | The composed products served to users |

Future suites (from the 2035 vision) extend this map: **Cloud, AI, Analytics, Developer Portal, API Gateway, Documentation, Learning, Community**.

## Rules for suites

1. **One owner.** Every suite has a named maintainer accountable for its quality, metrics, and roadmap (Chapter 8).
2. **Compose through contracts.** Suites expose APIs; they do not reach into each other's internals (Chapter 6.1).
3. **One core.** Shared foundations (tenancy, identity, audit, security, logging) live in the Core Platform and are consumed, not duplicated.
4. **Measured.** Every suite carries a maturity level (L0–L7, Chapter 10.2) reviewed by the Platform Council.
5. **Marketplace-ready potential.** A suite may be opened to third parties (L7) when it is Enterprise Certified (L5) and AI-capable (L6) — the path to a platform business.

## How a new sector joins the platform

A new vertical (e.g. logistics, agriculture, healthcare) does not create a new island. It:

1. adds a new **application** or **suite capability** on top of the Core Platform,
2. reuses Identity, Tenancy, Payments, and Audit,
3. passes the same maturity model and constitutional review.

This is how the platform scales from one marketplace to many sectors without multiplying complexity.

## Related documents

- [Constitution, Chapter 6 — Architecture Principles](constitution/06-architecture-principles.md)
- [Constitution, Chapter 10 — The Future (maturity model)](constitution/10-the-future.md)
- [Engineering Institute](engineering-institute.md)
