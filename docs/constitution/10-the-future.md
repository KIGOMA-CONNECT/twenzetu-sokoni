# Chapter 10 — The Future

This chapter is the roadmap dimension of the Constitution. It defines the platforms we are building toward, the maturity model we use to measure them, and the milestones that connect today's marketplace to the 2035 vision.

## 10.1 The family of platforms

By 2035 AfriMarket will be a family of platforms:

- **AfriMarket Cloud** — managed hosting and operations for tenants.
- **AfriMarket Identity** — identity, authentication, roles, and single sign-on across suites (today: `libs/identity`).
- **AfriMarket Marketplace** — commerce: products, vendors, orders, services, logistics (today: `libs/marketplace`, live).
- **AfriMarket Payments** — mobile money, payments, wallets, settlements (today: `libs/integrations`, activation in progress).
- **AfriMarket AI** — intelligence across commerce: recommendations, forecasting, support.
- **AfriMarket Analytics** — reporting, dashboards, and insights for tenants.
- **AfriMarket Developer Portal** — docs, keys, and onboarding for partners.
- **AfriMarket API Gateway** — the public, governed entry point to all suites.
- **AfriMarket Documentation** — product, platform, and API documentation.
- **AfriMarket Learning** — the academy experience (see Engineering Institute).
- **AfriMarket Community** — support, feedback, and ecosystem.

They are Enterprise Suites of one platform — not standalone modules (see [Enterprise Suites](../enterprise-suites.md)).

## 10.2 Maturity levels

Every platform is measured against a maturity model. Nothing is "done" or "in development" — everything is at a level.

| Level | Name | Meaning |
|---|---|---|
| **L0** | Concept | Idea articulated; no committed resources. |
| **L1** | Architecture Approved | Structure, boundaries, and standards approved by the Platform Council. |
| **L2** | Domain Model Complete | Core domain concepts modelled and stable. |
| **L3** | APIs Complete | Public/internal contracts defined, documented, and tested. |
| **L4** | Production Ready | Running in production, monitored, supported, secure. |
| **L5** | Enterprise Certified | Meets enterprise requirements: audit, compliance, SLA, support. |
| **L6** | AI Enhanced | Uses intelligence to improve outcomes and operations. |
| **L7** | Marketplace Ready | Open to third parties as a governed, monetizable platform. |

Maturity level changes are recorded decisions (Chapter 9) with evidence.

## 10.3 Current posture (2026)

| Platform | Level | Evidence / Notes |
|---|---|---|
| Marketplace | **L4** | Live at `twenzetusokoni.com`; real vendors, orders, services; monitored; secure CI. |
| Identity | **L3** | AuthN/AuthZ, roles, tenants in production; SSO and self-service are next. |
| Engagement (USSD) | **L2** | USSD channel implemented; needs production hardening. |
| Payments | **L2** | M-Pesa/AzamPay integrations scaffolded (sandbox); production keys pending. |
| Core Platform (audit, finance, queue, tracing) | **L4** | Operational foundations live in the monorepo. |
| Analytics | **L1** | Metrics exposed; dashboards and self-service reporting pending. |
| Cloud, AI, Developer Portal, API Gateway, Documentation, Learning, Community | **L0–L1** | Concept/architecture phase (see 10.4 and roadmap docs). |

## 10.4 The roadmap to 2035

| Horizon | Theme | Milestones |
|---|---|---|
| 2026–2027 | **Prove** | Payments live (M-Pesa/AzamPay), Analytics L3, Enterprise Certification baseline, first institutional tenants, Engineering Institute charter. |
| 2028–2030 | **Scale** | Developer Portal + API Gateway (L4), Identity as SSO, Learning & Community live, Marketplace L7 (open platform). |
| 2031–2035 | **Lead** | AfriMarket Cloud, AI across suites (L6), Documentation as a living system, recognition as a world-leading African enterprise platform. |

## 10.5 The Engineering Institute

The 2035 vision is built on knowledge as much as code. The AfriMarket Engineering Institute (see [Engineering Institute](../engineering-institute.md)) will provide Research, Architecture, Certification, and Training — the ecosystem that turns a great platform into a great profession.

## 10.6 Exit and legacy

- Every platform must outlive any individual. Records, documentation, and ownership are never locked in one person's head.
- If a platform ever ceases to serve the Vision, it is retired with a recorded decision and a migration path — never silently abandoned.

> The future is not something that happens to us. It is something we build, one level at a time, under this Constitution.
