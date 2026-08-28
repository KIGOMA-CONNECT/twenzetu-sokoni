# ABMS Architecture Definition Document (ADD) v1.0

> "Usianze kuandika code. Kwanza tutengeneze Architecture Definition Document (ADD), halafu Domain Model, halafu PRD, halafu Database Model, halafu API Contracts, ndipo implementation ianze."

## 1. Document Information

| Field | Value |
|---|---|
| Document | Architecture Definition Document |
| Version | 1.0 |
| Date | 2026-08-26 |
| Status | Ratified |
| Scope | ABMS Foundation Platform |
| Constitution Reference | Chapters 5, 6, 9 |

## 2. Executive Summary

ABMS (African Business Management System) is an Enterprise Business Operating Platform (EBOP) built under the ABMS Enterprise Architecture Framework (AEAF). This document defines the architecture of the Foundation Platform — the minimal set of capabilities required before any business module (Finance, HR, Inventory, Procurement) can be built.

The Foundation Platform consists of 10 core platforms:

1. Kernel
2. Identity
3. Tenancy
4. Organization
5. Metadata
6. Universal Business Registry (UBR)
7. Configuration
8. Audit
9. Workflow
10. Notification
11. Scheduler

## 3. Architectural Drivers

### 3.1 Quality Attributes

| Attribute | Requirement | Priority |
|---|---|---|
| **Modifiability** | Frameworks (NestJS, PostgreSQL) must be replaceable without rewriting domain logic | Critical |
| **Security** | Row Level Security, RBAC, audit trail on every financial action | Critical |
| **Scalability** | Must support millions of tenants with sub-second response | High |
| **Availability** | 99.9% uptime for production deployments | High |
| **Testability** | Every layer independently testable | High |
| **Observability** | Structured logs, metrics, tracing on every service | High |

### 3.2 Constraints

- Zero Rewrite Philosophy (ADR-0002)
- Domain Driven Design (ADR-0004)
- Clean Architecture (ADR-0005)
- API First (ADR-0003)
- Event Driven (ADR-0006)
- Multi-Tenant (ADR-0011)
- Security by Design (ADR-0012)

### 3.3 Business Rules

- Every record belongs to a tenant
- No tenant can access another tenant's data
- Business rules never depend on frameworks
- UI is the last layer, not the first
- Configuration over customization

## 4. System Architecture

### 4.1 Layer Architecture

```
┌─────────────────────────────────────────────────┐
│                  PRESENTATION                     │
│  Controllers • DTOs • Guards • Interceptors      │
├─────────────────────────────────────────────────┤
│                  APPLICATION                      │
│  Use Cases • Commands • Queries • Services       │
├─────────────────────────────────────────────────┤
│                    DOMAIN                         │
│  Aggregates • Entities • Value Objects           │
│  Domain Events • Repositories (interfaces)       │
│  Domain Services • Specifications                │
├─────────────────────────────────────────────────┤
│                 INFRASTRUCTURE                   │
│  TypeORM • PostgreSQL • Redis • External APIs    │
│  Repository implementations • Event dispatch     │
└─────────────────────────────────────────────────┘
```

**Dependency Rule:** Dependencies point inward. Domain has zero framework dependencies.

### 4.2 Module Architecture

Every ABMS module follows this internal structure:

```
module/
├── domain/
│   ├── aggregates/
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   ├── services/
│   └── repositories/ (interfaces only)
├── application/
│   ├── commands/
│   ├── queries/
│   ├── use-cases/
│   └── services/
├── infrastructure/
│   ├── entities/ (TypeORM)
│   ├── repositories/ (implementations)
│   └── persistence/
├── presentation/
│   ├── controllers/
│   ├── dto/
│   ├── guards/
│   └── interceptors/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

### 4.3 Multi-Tenant Hierarchy

```
Tenant (execution boundary)
  └── Company (legal entity)
       └── Branch (physical location)
            └── Department (organizational unit)
                 └── Business Unit (functional unit)
                      └── User (individual actor)
```

**Rules:**
- Every entity carries `tenant_id`
- Every query is scoped to current tenant
- Tenant context is extracted from JWT or header
- No cross-tenant queries allowed

### 4.4 Event Architecture

```
Domain Event (within aggregate)
  ↓
Event Bus (in-process)
  ↓
Integration Event (cross-module)
  ↓
Event Handler (async)
  ↓
Side Effect (notification, audit, analytics)
```

**Rules:**
- Events are immutable
- Events are versioned
- Events carry tenant context
- Events are logged for audit

## 5. Foundation Platform Architecture

### 5.1 Kernel

**Purpose:** Shared building blocks for all modules.

**Components:**
- `Entity<TId>` — Base entity with identity equality
- `AggregateRoot<TId>` — Entity with domain events
- `ValueObject<T>` — Immutable value with structural equality
- `Identifier<T>` — Generic identifier base
- `EntityId` — UUID-based entity identifier
- `Result<T, E>` — Monad for success/failure
- `Guard` — Assertion utilities
- `DomainEvent` — Event base class
- `IRepository<T>` — Repository interface
- `IUnitOfWork` — Transaction interface
- CQRS interfaces (ICommand, IQuery, IEventBus)

**Dependencies:** None (zero external dependencies)

### 5.2 Identity Platform

**Purpose:** Authentication, Authorization, User Management.

**Aggregates:**
- `User` — User entity with roles, permissions, status
- `Tenant` — Tenant entity with configuration

**Services:**
- `AuthService` — Login, register, OTP, password reset
- `SessionService` — Session management, token rotation
- `PasswordHasher` — Argon2 password hashing

**Current Level:** L3 (APIs Complete)

### 5.3 Tenancy Platform

**Purpose:** Multi-tenant isolation and context.

**Components:**
- `TenantMiddleware` — Extracts tenant from request
- `TenantResolver` — Resolves tenant from header/JWT
- `TenantContext` — AsyncLocalStorage for tenant scope
- `RedisCacheModule` — Per-tenant caching

**Current Level:** L4 (Production Ready)

### 5.4 Organization Platform

**Purpose:** Company, Branch, Department, Business Unit management.

**Aggregates:**
- `Organization` — Company, Branch, Department hierarchy
- `JobPosition` — Position definitions
- `CostCenter` — Cost center tracking

**Current Level:** L1 (Architecture Approved)

### 5.5 Metadata Platform

**Purpose:** Dynamic field definitions, form layouts, permissions.

**Aggregates:**
- `FieldMetadata` — Field definitions per entity type
- `FormMetadata` — Form layouts per entity type
- `EntityPermission` — Role-based permissions per entity type

**Services:**
- `MetadataEngineService` — CRUD + dynamic UI generation

**Current Level:** L2 (Domain Model Complete)

### 5.6 Universal Business Registry (UBR)

**Purpose:** Canonical entity registration and relationship mapping.

**Aggregates:**
- `RegisteredEntity` — Any business entity (Person, Product, etc.)
- `EntityRelationship` — IS_A, HAS, USES relationships

**Services:**
- `OntologyService` — CRUD + ontology queries

**Current Level:** L2 (Domain Model Complete)

### 5.7 Configuration Platform

**Purpose:** System and tenant configuration management.

**Aggregates:**
- `SystemConfig` — Global system configuration
- `TenantConfig` — Per-tenant configuration
- `FeatureFlag` — Feature toggle management

**Current Level:** L0 (Concept)

### 5.8 Audit Platform

**Purpose:** Immutable audit trail for all actions.

**Aggregates:**
- `AuditLog` — Immutable audit record

**Services:**
- `AuditService` — Log creation, query, export

**Current Level:** L2 (Domain Model Complete)

### 5.9 Workflow Platform

**Purpose:** Approval workflows and business process automation.

**Aggregates:**
- `Workflow` — Workflow definition
- `WorkflowInstance` — Running workflow instance
- `WorkflowStep` — Individual step in workflow
- `WorkflowAction` — Action taken on step

**Services:**
- `WorkflowEngine` — Start, progress, complete workflows
- `ApprovalService` — Approval/rejection logic

**Current Level:** L0 (Concept)

### 5.10 Notification Platform

**Purpose:** Multi-channel notification delivery.

**Aggregates:**
- `Notification` — Notification record
- `NotificationTemplate` — Template definitions
- `NotificationPreference` — User preferences

**Services:**
- `NotificationService` — Send via SMS, Email, Push, In-App
- `NotificationRouter` — Route to correct channel

**Current Level:** L0 (Concept)

### 5.11 Scheduler Platform

**Purpose:** Background job scheduling and execution.

**Aggregates:**
- `ScheduledJob` — Job definition
- `JobExecution` — Execution history

**Services:**
- `SchedulerService` — Cron scheduling, one-time jobs
- `JobQueue` — BullMQ integration

**Current Level:** L2 (Existing in scheduler module)

## 6. Data Architecture

### 6.1 Database Standards

- **Engine:** PostgreSQL 16
- **ORM:** TypeORM
- **Naming:** snake_case columns, plural table names
- **Primary Keys:** UUID v4
- **Audit Columns:** `created_at`, `updated_at`, `created_by`, `updated_by`
- **Soft Delete:** `deleted_at` column (nullable)
- **Optimistic Locking:** `version` column
- **Migrations:** All changes via migrations, no `synchronize: true`

### 6.2 Entity Base Classes

```typescript
// Global entities (not tenant-scoped)
abstract class GlobalEntity {
  id: UUID
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}

// Tenant-aware entities
abstract class TenantAwareEntity {
  id: UUID
  tenant_id: UUID (indexed)
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

### 6.3 Row Level Security

```sql
-- Every query must include tenant filter
WHERE tenant_id = :currentTenantId
```

## 7. Security Architecture

### 7.1 Authentication

- JWT tokens (access + refresh)
- OTP via SMS
- Password with Argon2 hashing
- Session management with token rotation

### 7.2 Authorization

- RBAC (Role-Based Access Control)
- Permissions per entity type
- Scope: ALL, OWN, DEPARTMENT, BRANCH, COMPANY
- Field-level read/write permissions

### 7.3 Audit

- Immutable audit log (WORM)
- Every financial action logged
- Every entity mutation logged
- Audit trail searchable and exportable

### 7.4 Data Protection

- TLS 1.3 in transit
- AES-256 at rest
- Secrets in environment variables
- No secrets in code

## 8. Integration Architecture

### 8.1 Internal Integration

- Event Bus (in-process for now, external later)
- Direct service calls within same module
- Repository pattern for data access

### 8.2 External Integration

- REST APIs for external consumers
- Webhooks for event notification
- SMS/Email via provider adapters
- Payment via provider adapters

## 9. Deployment Architecture

### 9.1 Development

- Docker Compose (PostgreSQL + Redis + API)
- Hot reload with NestJS

### 9.2 Production

- Docker containers
- PostgreSQL (managed or self-hosted)
- Redis (managed or self-hosted)
- Nginx reverse proxy
- SSL/TLS termination

## 10. Build Sequence

### Phase 1: Foundation (Current)
1. ✅ Kernel
2. ✅ Identity
3. ✅ Tenancy
4. ✅ Organization (L1)
5. ✅ Metadata (L2)
6. ✅ UBR (L2)
7. 🔲 Configuration (L0 → L2)
8. 🔲 Audit (L2 → L3)
9. 🔲 Workflow (L0 → L2)
10. 🔲 Notification (L0 → L2)
11. 🔲 Scheduler (L2 → L3)

### Phase 2: Business Platforms (After Foundation Stable)
12. Finance
13. HR
14. CRM
15. Procurement
16. Inventory
17. Reporting

### Phase 3: Advanced Platforms
18. Analytics
19. AI
20. Developer Portal
21. API Gateway

## 11. Architecture Decision Records

All architectural decisions are recorded in `docs/abms/adr/`. The following ADRs apply to the Foundation Platform:

| ADR | Title | Status |
|---|---|---|
| 0001 | Enterprise Business Operating Platform | Accepted |
| 0002 | Zero Rewrite Philosophy | Accepted |
| 0003 | API First | Accepted |
| 0004 | Domain First | Accepted |
| 0005 | Framework Independence | Accepted |
| 0006 | Event Driven | Accepted |
| 0007 | Everything is an Entity | Accepted |
| 0008 | Everything is Metadata | Accepted |
| 0009 | Everything is AI Augmented | Accepted |
| 0010 | Configuration over Customization | Accepted |
| 0011 | Multi-Tenancy as Core Architecture | Accepted |
| 0012 | Security by Design | Accepted |
| 0013 | Business Constitution per Bounded Context | Accepted |
| 0014 | Global Business Graph | Proposed |

## 12. Appendix

### 12.1 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22+ |
| Language | TypeScript | 5.9 |
| Framework | NestJS | 11 |
| ORM | TypeORM | 1.1 |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7 |
| Queue | BullMQ | Latest |
| Testing | Jest | 30 |
| Frontend | React | 19 |
| Build | Nx | 23 |

### 12.2 Package Naming

| Scope | Pattern | Example |
|---|---|---|
| Domain | `@abms/<module>-domain` | `@abms/ubr` |
| Infrastructure | `@abms/<module>-infrastructure` | `@abms/ubr-infrastructure` |
| API | `@abms/<module>-api` | `@abms/ubr-api` |
| Core | `@afri-market/<module>` | `@afri-market/kernel` |

> This document is the architectural foundation of ABMS. Every line of code must trace back to this document.
