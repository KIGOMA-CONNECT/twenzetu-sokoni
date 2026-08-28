# START HERE

> Welcome to ABMS — African Business Management System.
> An AI-Ready Enterprise Business Operating System for Africa and the Global Market.

**Developer mpya anaingia. Ndani ya saa moja anaelewa philosophy yote.**

---

## Who We Are

ABMS is an Enterprise Business Operating Platform designed to provide organizations with a unified digital foundation for managing business operations, governance, financial resources, human capital, customer relationships, assets, supply chains, analytics, and intelligent automation.

We are not an ERP. We are not accounting software. We are an **Enterprise Business Operating Platform** — a platform on which multiple business domains live.

## Why We Exist

Businesses should spend their time creating value for customers — not struggling with disconnected systems, duplicated data, and fragmented processes. ABMS builds trusted digital infrastructure that enables organizations to operate efficiently, make informed decisions, and innovate with confidence.

## Architecture

ABMS follows the **ABMS Enterprise Architecture Framework (AEAF)**:

- **Domain-Driven Design** — Business domains drive all design decisions
- **Clean Architecture** — UI is the last layer, not the first
- **Event-Driven** — Platforms communicate via events, not direct calls
- **API-First** — Every capability is accessible through stable APIs
- **Multi-Tenant** — Every entity carries tenant context
- **AI-Ready** — Every capability exposes structured data for AI

The ABMS Pyramid:
```
                           USERS
                              ▲
                     Industry Solutions
                              ▲
                    Enterprise Platforms
                              ▲
                     Enterprise Engines
                              ▲
                     ABMS Core Kernel
                              ▲
                Enterprise Infrastructure
                              ▲
                    Enterprise Standards
                              ▲
                    Enterprise Knowledge
```

## Engineering Principles

1. Business capability before implementation
2. Platform before product
3. Configuration before customization
4. Documentation evolves together with code
5. Every API is a product
6. Every platform must be extensible
7. Security is never optional
8. Data integrity is non-negotiable
9. Backward compatibility is the default
10. Architecture decisions must outlive frameworks

## Repository Guide

```
ABMS/
├── apps/
│   ├── api/                    # NestJS API (the composed product)
│   └── web/                    # React SPA frontend
├── libs/
│   ├── kernel/                 # Shared kernel (BaseEntity, ValueObject, etc.)
│   ├── identity/               # Identity platform (AuthN/AuthZ)
│   ├── marketplace/            # Marketplace platform (commerce engine)
│   ├── tenancy/                # Multi-tenancy infrastructure
│   ├── database/               # Database layer (TypeORM)
│   ├── core/                   # Core infrastructure (config, HTTP, logging, security)
│   ├── core-finance/           # Finance services
│   ├── core-queue/             # Background job queue (BullMQ)
│   ├── core-audit/             # Audit trail
│   ├── core-resilience/        # Circuit breaker
│   ├── core-tracing/           # Request tracing
│   ├── integrations/           # External integrations (SMS, payments, maps)
│   └── ussd/                   # USSD channel
├── docs/
│   ├── abms/                   # ABMS architecture docs
│   │   ├── ABMS-CONSTITUTION-v1.0.md
│   │   ├── ABMS-Enterprise-Capability-Map.md
│   │   ├── ABMS-Domain-Map.md
│   │   ├── ABMS-Platform-Map.md
│   │   ├── ABMS-Engineering-Standards.md
│   │   └── adr/                # Architecture Decision Records
│   ├── constitution/           # Platform constitution
│   └── adr/                    # Existing ADRs
└── scripts/                    # Operational scripts
```

## How Decisions Are Made

Every significant architectural decision is recorded as an **Architecture Decision Record (ADR)** in `docs/abms/adr/`. When in doubt, check the ADRs. When making a new decision, write a new ADR.

Read the Constitution: `docs/abms/ABMS-CONSTITUTION-v1.0.md`

## Development Workflow

1. Create a feature branch from `main`
2. Write tests first (TDD preferred)
3. Implement the feature
4. Update documentation
5. Submit a pull request
6. Code review + approval
7. Merge to `main`

## Coding Standards

- TypeScript with strict mode
- NestJS for backend
- React 19 for frontend
- PostgreSQL for database
- TypeORM for ORM
- Jest for testing
- ESLint + Prettier for formatting

See: `docs/abms/ABMS-Engineering-Standards.md`

## First Contribution

1. Read the Constitution (`docs/abms/ABMS-CONSTITUTION-v1.0.md`)
2. Read the Architecture Decision Records (`docs/abms/adr/`)
3. Read the Engineering Standards (`docs/abms/ABMS-Engineering-Standards.md`)
4. Pick a task from the issue board
5. Create a feature branch
6. Write tests
7. Implement
8. Document
9. Submit PR

---

> "Je, uamuzi huu bado utakuwa sahihi kama ABMS itakuwa na modules 200+, tenants milioni kadhaa, na bado inahitaji kubaki salama, rahisi kubadilisha, na kufanya kazi mwaka 2126?"

If the answer is "no", we do not make that decision — even if it would be easy today.
