# ADR-0005: Non-RLS identity tables and JWT-based tenant resolution

**Status:** Accepted

**Date:** 2026-07-14 (Sprint 4 — Identity & Access Foundation)

## Context

Every route in `apps/api` was fully unauthenticated through Sprint 3 — `libs/core/security` only had an unimplemented `ICurrentUserProvider` and an unwired `NoopAuthGuard`, explicitly commented "until the Auth sprint adds real authentication/RBAC guards." There was no `User` or `Tenant` row anywhere; `tenant_id` was a floating, opaque UUID trusted directly from a client-supplied `X-Tenant-Id` header (`HeaderTenantResolver`, ADR-0001/Sprint 1) — meaning any caller could claim to be any tenant. This sprint introduces the first-ever `Tenant`/`User` aggregates, real authentication (argon2 password hashing, `@nestjs/passport` + `passport-jwt`), and RBAC for four fixed roles (CEO, PROJECT_MANAGER, FINANCIAL_OFFICER, TEAM_MEMBER — named in the broader ABOS domain scope), while also closing the tenant-spoofing gap.

## Decision

### 1. `Tenant` and `User` are deliberately outside Row-Level Security

Login (find a user by email) and tenant registration must both work *before* any tenant is known — RLS filtering by `current_setting('app.tenant_id')` would make it structurally impossible to ever read these tables pre-authentication. `tenant` and `user` get real migrations (`CreateTenant`, `CreateUser`) that deliberately skip `enableRowLevelSecurity()`, with inline comments referencing this ADR so the omission doesn't read as an oversight — ADR-0001 called RLS "no exception path," and this is the first, explicit exception to that rule. `user.email` gets a DB-level unique index (not just an app-layer check-then-insert, which is a TOCTOU race under concurrent registrations). Neither entity extends `TenantAwareEntity`; `Tenant` uses a new `GlobalEntity` base (`id`/`createdAt`/`updatedAt`, no `tenantId`) in `libs/database`, and `User` declares its own plain `tenant_id` column (no FK to `tenant` this sprint — mirrors the codebase's existing opaque-UUID `tenant_id` posture elsewhere, e.g. ADR-0004's own deferred-FK precedent).

### 2. A second `IUnitOfWork` implementation: `GlobalUnitOfWork`

`TenantAwareUnitOfWork.withTransaction()` throws `TenantContextMissingException` whenever no tenant context is active — exactly the state during `/auth/register-tenant` and `/auth/login`. `GlobalUnitOfWork` (`libs/database`) opens a plain transaction with no `set_config` call, reusing the existing `TypeOrmTransactionContext` class unchanged. Identity's command handlers inject it by concrete type (`GlobalUnitOfWork`), matching this codebase's existing convention of injecting concrete Unit-of-Work classes rather than the `IUnitOfWork` interface (interfaces have no runtime DI token).

### 3. Tenant resolution moves from a trusted header to a verified JWT claim

`TenancyModule` becomes a `forRoot(options?: { resolverProvider?: Provider })` dynamic module (mirroring `DatabaseModule.forRoot(entities)`), defaulting to `HeaderTenantResolver`. `apps/api`'s composition root now passes a new `JwtTenantResolver` (`libs/identity/infrastructure`) instead. `JwtTenantResolver` decodes the JWT **independently of Passport's `AuthGuard('jwt')`**: Passport's guard runs as a Nest Guard, which executes strictly *after* Middleware in Nest's request lifecycle, but tenant context must be established at the Middleware stage (`TenantMiddleware`, which wraps everything downstream via `AsyncLocalStorage.run()`). `JwtTenantResolver` therefore reads `Authorization: Bearer <token>` and verifies it directly via an injected `JwtService`, extracting only the `tenantId` claim — not full validation (no `isActive` check; that remains `JwtStrategy.validate()`'s job later in the pipeline, for `request.user`/RBAC). **The JWT is decoded twice per authenticated request** — an accepted, deliberate cost in exchange for keeping "tenant context" and "route authorization" as cleanly separate concerns at their correct Nest lifecycle stages, rather than fighting `AsyncLocalStorage.enterWith()` semantics inside a Guard. `HeaderTenantResolver` remains available (the `forRoot()` default) for internal/test use.

`JwtService` is made ambiently available via `@nestjs/jwt`'s `JwtModule.registerAsync({ global: true, ... })`, registered once in `IdentityModule` — the same `global: true` pattern already used by `AppConfigModule`/`AppLoggerModule`/`DatabaseModule` in this codebase — so `JwtTenantResolver` (provided inside `TenancyModule.forRoot()`, which has no import edge to `IdentityModule`) can still resolve its `JwtService` dependency, without inverting the established `scope:tenancy` → `scope:identity` Nx dependency direction.

**Required fix surfaced by this change**: `libs/database/src/lib/database.module.ts` previously statically imported bare `TenancyModule` inside its own `forRoot()`. Once `TenancyModule` became `forRoot()`-only, this would have created two competing `@Global()` registrations of `AsyncLocalTenantContextStore` — two live instances wrapping the same `AsyncLocalStorage`, meaning a repository could silently read from a different store instance than `TenantMiddleware` writes to. `DatabaseModule.forRoot()` no longer imports `TenancyModule`; it only ever needed `AsyncLocalTenantContextStore`, already global from wherever the composition root registers `TenancyModule.forRoot()` once.

### 4. New exception + status mapping for JWT failures

`TenantResolutionException` (existing, `libs/tenancy`) maps to 400 — correct for `HeaderTenantResolver`'s failure mode (malformed/missing header is a client error), wrong for a missing/expired/invalid-signature JWT, which is a 401. New `AuthenticationFailedException` (code `AUTH.UNAUTHENTICATED`, `libs/identity/domain`) is thrown by both `JwtTenantResolver` and `LoginHandler` (using the same generic "Invalid email or password" message for both "no such user" and "wrong password," to avoid leaking which emails are registered), mapped to `HttpStatus.UNAUTHORIZED` in `GlobalExceptionFilter`'s status map.

### 5. RBAC: fixed roles, `@Roles()` + `RolesGuard`, replacing `NoopAuthGuard`

Four fixed roles (`'CEO' | 'PROJECT_MANAGER' | 'FINANCIAL_OFFICER' | 'TEAM_MEMBER'`) — a closed union, not a data-driven taxonomy like `OrgUnitType`, since RBAC roles are tied to actual permission-check code (`RolesGuard`), not free-form taxonomy. `JwtStrategy.validate()` looks up the user (rejecting if inactive) and populates `request.user`; `RolesGuard` reads `@Roles(...)` metadata and checks it. `NoopAuthGuard` (confirmed referenced nowhere else in the codebase) is removed — it was never wired into `AppModule`/`main.ts` in the first place, so this sprint is adding the first real guard, not swapping one out. `ICurrentUserProvider` (previously unimplemented) gets its first real, request-scoped implementation against `request.user`.

### 6. Password hashing: argon2

Per explicit choice — the OWASP-recommended default, stronger against GPU cracking than bcrypt. This is the first native npm dependency in the whole repo; installation was spike-tested standalone before committing to it (installed cleanly with a prebuilt binary on this environment, no native toolchain required). `@node-rs/argon2` is the documented fallback if a future environment can't install prebuilt `argon2` binaries. Wrapped behind a small `IPasswordHasher` interface (`ArgonPasswordHasher`) so the library choice doesn't leak into handlers or tests.

## Alternatives Considered

- **Apply RLS to `Tenant`/`User` with a bootstrap/superuser bypass for login.** Rejected — would require a third database role beyond the existing owner/runtime split (ADR-0001), blurring a boundary that ADR-0001 deliberately drew, for a problem a plain non-RLS table already solves cleanly.
- **Resolve tenant context inside a Guard using `AsyncLocalStorage.enterWith()`.** Considered and rejected: even if made to work, it would need to run *before every other Guard* including RBAC checks that may themselves need tenant context — reintroducing the exact Middleware-vs-Guard ordering problem it was meant to avoid, with a less-precedented Node API than the existing `.run()`-in-Middleware pattern already proven in this codebase.
- **`@nestjs/jwt` + a hand-rolled guard, no Passport.** Rejected per explicit user choice in favor of `@nestjs/passport` + `passport-jwt`, the more standard NestJS auth pattern, despite it adding a layer of indirection this codebase otherwise avoids.
- **Keep `X-Tenant-Id` header trust as the production default.** Rejected — it is a live, unauthenticated tenant-spoofing vector; closing it was an explicit goal of this sprint, not an incidental side effect.
- **bcrypt or bcryptjs instead of argon2.** Rejected per explicit user choice of the current OWASP-recommended default over the older, more widely-precedented bcrypt, and over the native-build-avoiding but weaker bcryptjs.

## Consequences

- Every future module that needs "who is the current user" now has a real, working answer (`request.user`, `ICurrentUserProvider`) instead of an unimplemented stub.
- `RegisterTenantHandler`/`LoginHandler`/`CreateUserHandler` are the first handlers in this codebase to use `GlobalUnitOfWork` instead of `TenantAwareUnitOfWork` — a pattern any future "must run before tenant context exists" flow should reuse rather than reinventing.
- No FK from `user.tenant_id` → `tenant.id` yet — a known, documented integrity gap (mirrors ADR-0004's own precedent), not an oversight.
- **No rate limiting on `/auth/login` this sprint.** Brute-force protection is a standard ask for an Identity sprint but was explicitly out of scope here — flagged as a follow-up, not a silent gap.
- Existing routes (Organization) are now implicitly gated behind possessing a *valid* JWT (since `TenantMiddleware` now requires one to resolve tenant context at all) even though `RolesGuard`/`@Roles()` were not applied to them this sprint — only the new `POST /auth/users` route has explicit RBAC. Verified end-to-end: a request with no `Authorization` header, an invalid/expired token, or only the old `X-Tenant-Id` header, is now rejected with 401 on every route that goes through `TenantMiddleware`.
- The JWT is decoded twice on every authenticated request (tenant resolver + Passport guard) — accepted as a negligible, documented cost.
