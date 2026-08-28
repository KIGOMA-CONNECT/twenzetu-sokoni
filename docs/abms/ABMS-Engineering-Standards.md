# ABMS Engineering Standards

> How we build. This document defines the coding, testing, documentation, and release standards for all ABMS platforms.

## Repository Standards

### Monorepo Structure

```
ABMS/
├── apps/
│   ├── api/                    # NestJS API
│   └── web/                    # React SPA
├── libs/
│   ├── kernel/                 # Shared kernel (BaseEntity, ValueObject, etc.)
│   ├── identity/               # Identity platform
│   ├── marketplace/            # Marketplace platform
│   ├── tenancy/                # Multi-tenancy
│   ├── database/               # Database layer
│   ├── core/                   # Core infrastructure
│   ├── core-finance/           # Finance services
│   ├── core-queue/             # Background jobs
│   ├── core-audit/             # Audit trail
│   ├── core-resilience/        # Circuit breaker
│   ├── core-tracing/           # Request tracing
│   ├── integrations/           # External integrations
│   └── ussd/                   # USSD channel
├── docs/
│   ├── abms/                   # ABMS architecture docs
│   │   ├── ABMS-CONSTITUTION-v1.0.md
│   │   ├── ABMS-Enterprise-Capability-Map.md
│   │   ├── ABMS-Domain-Map.md
│   │   ├── ABMS-Platform-Map.md
│   │   └── adr/                # Architecture Decision Records
│   ├── constitution/           # Platform constitution
│   ├── adr/                    # Existing ADRs
│   └── engineering/            # Engineering standards
└── scripts/                    # Operational scripts
```

### Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Files | kebab-case | `user.aggregate.ts` |
| Classes | PascalCase | `UserAggregate` |
| Interfaces | PascalCase with `I` prefix | `IUserRepository` |
| DTOs | PascalCase with `Dto` suffix | `LoginDto` |
| Entities | PascalCase with `Entity` suffix | `UserOrmEntity` |
| Services | PascalCase with `Service` suffix | `AuthService` |
| Controllers | PascalCase with `Controller` suffix | `AuthController` |
| Modules | PascalCase with `Module` suffix | `IdentityModule` |
| Events | PascalCase | `UserCreated` |
| Commands | PascalCase with `Command` suffix | `CreateUserCommand` |
| Queries | PascalCase with `Query` suffix | `GetUserQuery` |
| Use Cases | PascalCase with `UseCase` suffix | `LoginUseCase` |
| Guards | PascalCase with `Guard` suffix | `RolesGuard` |
| Interceptors | PascalCase with `Interceptor` suffix | `RequestLoggingInterceptor` |

### Database Standards

- PostgreSQL is the canonical database.
- No `synchronize: true` in production.
- All changes via migrations.
- Snake_case for columns and tables.
- Plural table names.
- UUID for primary keys.
- Audit columns on every table: `created_at`, `updated_at`, `created_by`, `updated_by`.
- Soft delete with `deleted_at` column.
- Optimistic locking with `version` column.

### Module Structure

Every platform module follows this structure:

```
module/
├── application/
│   ├── commands/
│   ├── queries/
│   ├── use-cases/
│   └── services/
├── domain/
│   ├── aggregates/
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   ├── repositories/
│   └── services/
├── infrastructure/
│   ├── entities/
│   ├── repositories/
│   ├── services/
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

**Hakuna exception.** Every module follows this structure.

### Domain Rules

- Aggregate moja per bounded context.
- Repository moja per aggregate.
- Factory moja (ikiwa linahitajika).
- Value Objects immutable.
- Entities mutable kupitia methods tu.
- Hakuna public setters.
- Hakuna business logic in controllers.
- Hakuna direct database access between platforms.

## Testing Standards

| Layer | Test Type | Framework |
|---|---|---|
| Domain | Unit Tests | Jest |
| Application | Use Case Tests | Jest |
| Infrastructure | Integration Tests | Jest + Test DB |
| Presentation | API Tests | Jest + Supertest |
| End-to-End | Full Business Flow | Jest |

### Test Requirements

- Hakuna feature inayokamilika bila test.
- Minimum 80% code coverage for new code.
- Integration tests for all repository implementations.
- API tests for all controller endpoints.
- E2E tests for critical business flows.

## Documentation Standards

- Every ADR is documented before implementation.
- Every API endpoint has OpenAPI documentation.
- Every platform has a README.md.
- Every use case has a brief description.
- Code comments explain "why", not "what".
- Documentation is part of the definition of done.

## Release Strategy

### Branching

- `main` — production-ready code
- `develop` — integration branch
- `feature/*` — feature branches
- `fix/*` — bug fix branches
- `release/*` — release preparation branches

### Versioning

- Semantic versioning (MAJOR.MINOR.PATCH)
- API versioning via URL path (`/v1/`, `/v2/`)
- Database versioning via migrations
- Event versioning via schema registry

### Release Process

1. Feature complete on `develop`
2. Code review + approval
3. Tests pass (unit, integration, e2e)
4. Documentation updated
5. Security review
6. Performance benchmarks
7. Release branch created
8. Staging deployment
9. QA validation
10. Production deployment
11. Post-deployment verification

## Code Review Checklist

Before any merge to `main`:

- [ ] Code follows naming conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No hardcoded values (use configuration)
- [ ] No secrets in code
- [ ] API changes are versioned
- [ ] Database changes have migrations
- [ ] Security implications reviewed
- [ ] Performance implications reviewed
- [ ] Constitution alignment verified
