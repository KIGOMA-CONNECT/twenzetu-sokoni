# Chapter 6 — Architecture Principles

Architecture principles govern the shape of the platform. They exist so that AfriMarket can grow from a modular marketplace into the 2035 vision without being rebuilt.

## 6.1 Suites, not silos

- Capability is organized into **Enterprise Suites** (Marketplace, Identity, Payments, Engagement, Analytics, and core platform services) rather than a pile of standalone modules.
- Suites are boundaries for ownership, APIs, and maturity tracking. They compose through contracts, not by reaching into each other's internals (see [Enterprise Suites](../enterprise-suites.md)).
- The current monorepo is the seed of the platform: `libs/` contains suite-oriented libraries (`identity`, `marketplace`, `tenancy`, `ussd`, `integrations`, `core-*`) that can evolve into suites without a rewrite.

## 6.2 API-first

- Every capability that can be consumed by more than one channel is exposed through a documented API.
- Our public contract is stable: consumers (web, Android/TWA, USSD, partners) depend on contracts, not on implementation.
- The API Gateway and Developer Portal are future suites (maturity L0) that formalize this principle.

## 6.3 Multi-tenancy is foundational

- Tenancy is not an afterthought. It is built into the core (`libs/tenancy`).
- Tenant data, configuration, and billing are isolated by design; tenant context is explicit in API calls.
- Growing from one tenant (our own marketplace) to many tenants must not require re-architecture.

## 6.4 Secure and observable by construction

- Security (Chapter 5.1) and observability (logging, metrics, tracing, audit) are wired into the core platform, not bolted on per feature.
- Every suite reports health (`/api/health`), metrics, and audit events from day one.

## 6.5 Cloud-ready and portable

- We deploy on commodity infrastructure (containers, standard Postgres/Redis) so we are never hostage to a single vendor.
- Production runs from a reproducible `docker-compose.prod.yml` and a version-controlled deploy pipeline.
- The future AfriMarket Cloud suite will offer this as a managed product.

## 6.6 Backward compatibility and change control

- Internal APIs and shared libraries follow semantic versioning.
- Breaking changes require: a migration path, a documented decision (Chapter 9), and coordination with all known consumers.
- We prefer additive change (new endpoints, new fields) over mutation.

## 6.7 Performance and cost awareness

- We measure what we run: request latency, error rates, queue depth, database load.
- Every architecture decision considers operating cost — a platform Africa can afford is a platform that will grow.
- Heavy work is asynchronous (queues, workers) so the API stays fast and cheap.

## 6.8 Standards over invention

- We adopt open standards (OAuth/JWT identity flows, OpenAPI, standard HTTP, relational data models) and mature tooling.
- We only build a custom platform component when no responsible standard or tool exists.

## 6.9 Evolutionary, not all-at-once

- We migrate toward the vision in measured steps, each with a maturity level (Chapter 10).
- We never freeze the platform for a "big bang" rewrite. The monorepo, the suites, and the future distributed services evolve from the same code.
