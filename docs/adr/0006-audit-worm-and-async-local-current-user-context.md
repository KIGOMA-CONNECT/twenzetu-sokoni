# ADR-0006: Audit/WORM Logging and AsyncLocalStorage-Based Current-User Context

**Status:** Accepted

**Date:** 2026-07-14

## Context

Every command handler in the system (19 as of this sprint, across organization
and identity) silently succeeds or fails with no durable record of who did
what, when, to which tenant, or why it failed. This is a real, live compliance
gap for a system whose own Constitution (Ch. on Data Governance) requires an
audit trail per transaction. The user explicitly requested this as a
Foundation-layer sprint ("Workflow Engine/Audit-WORM kama Foundation sprint
kabla ya HR") before proceeding to HR.

Two requirements shape the design:

1. **Audit entries must be genuinely immutable** (Write-Once-Read-Many) — an
   audit trail that can be edited or deleted after the fact has no evidentiary
   value.
2. **Every command handler must get this "for free"** — retrofitting 19
   existing handlers' business logic individually, and requiring every future
   handler author to remember to call an audit logger, is both a large diff
   and a guaranteed-to-be-forgotten discipline problem.

A related, deeper problem was discovered *while verifying this sprint's own
work end-to-end*: after wiring up audit logging, `userId` was silently `null`
on every single audit entry, even for fully authenticated requests. Root
cause: `RequestCurrentUserProvider` (introduced in Sprint 4) was
`@Injectable({ scope: Scope.REQUEST })`, reading `request.user` via
`@Inject(REQUEST)`. But `@nestjs/cqrs` resolves `@CommandHandler`/`@QueryHandler`
classes once, as singletons, at application bootstrap — before any HTTP
request exists. A request-scoped provider injected into a bootstrap-time
singleton can never see the actual current request; `RequestCurrentUserProvider`
was silently bound to an empty/no-request context for the lifetime of the
process. This is a structural limitation of `@nestjs/cqrs`, not a
configuration mistake — no combination of Nest DI options fixes it.

## Decision

### 1. Audit logging happens at one choke point: `TransactionalCommandHandler.execute()`

Every command handler already extends this single base class
(`libs/cqrs`). Its `execute()` method is extended to capture
`commandName` (`command.constructor.name`), `tenantId`
(`AsyncLocalTenantContextStore.getTenantId() ?? null`), `userId` (see below),
and `correlationId` (from the transaction context, falling back to a fresh
UUID if the transaction never started), then log a `SUCCESS` entry after a
successful commit or a `FAILURE` entry (with the error's message) in the
catch block before re-throwing. `TransactionalQueryHandler` is deliberately
**not** touched — audit logging covers mutations, not reads. Audit-logging
failures are swallowed (fail-open): a broken audit sink must never mask a
real command's success/failure from its caller.

Concretely, this meant every existing handler's constructor gained three new
parameters (`AsyncLocalTenantContextStore`, `@Inject(CURRENT_USER_PROVIDER)`,
`@Inject(AUDIT_LOGGER)`) forwarded to `super()` — a mechanical, one-time
19-file change, not an ongoing discipline requirement for handler authors.

### 2. New foundation-tier `libs/audit` lib: `IAuditLogger` / `TypeOrmAuditLogger` / `AuditLogOrmEntity`

`IAuditLogger.log(entry)` is the only interface surface. `TypeOrmAuditLogger`
injects `DataSource` directly (not a `Repository` via `@InjectRepository`,
since `libs/audit` has no NestJS module of its own) and does a plain insert —
no transaction, no `UnitOfWork`, since an audit write must never roll back
just because the business transaction it's describing failed.

### 3. `audit_log` is a non-RLS ("global") table — WORM via explicit `REVOKE`, not RLS

Same precedent as `Tenant`/`User` in ADR-0005: some audited actions (a login
attempt against an unknown email, tenant registration itself) happen before
any tenant context exists, so RLS's `WITH CHECK` would reject the insert.
`AuditLogOrmEntity extends GlobalEntity`, no `enableRowLevelSecurity()` call
in its migration.

**WORM is a distinct property from RLS and is enforced separately**: the
audit_log migration issues `REVOKE UPDATE, DELETE ON "audit_log" FROM
"abms_runtime"` — necessary because `docker/postgres/init-db.sh`'s
`ALTER DEFAULT PRIVILEGES` blanket-grants `abms_runtime` SELECT/INSERT/UPDATE/
DELETE on every newly created table. Without this explicit revoke, WORM would
not hold despite RLS being irrelevant to it. Verified directly (both via
`psql` as `abms_runtime` and via an integration test): `UPDATE`/`DELETE`
against `audit_log` fail with "permission denied for table audit_log";
`INSERT` succeeds normally through `TypeOrmAuditLogger`.

### 4. `CURRENT_USER_PROVIDER` is bound to `AsyncLocalCurrentUserStore`, not a request-scoped provider

`AsyncLocalCurrentUserStore` (`libs/core/security`) mirrors
`AsyncLocalTenantContextStore` (`libs/tenancy`) exactly: a plain singleton
`@Injectable()` wrapping `node:async_hooks`' `AsyncLocalStorage`, with
`run(userId, callback)` and `getCurrentUserId()`. Because it is a normal
singleton (not request-scoped), `@nestjs/cqrs`'s bootstrap-time handler
resolution works correctly — the store instance is fixed, only the value
inside its `AsyncLocalStorage` changes per async execution context.

A new `CurrentUserMiddleware` (`libs/identity/infrastructure`) populates it:
decodes the bearer token's `sub` claim (`jwtService.decode()`, not
`.verify()` — by the time this middleware runs, `TenantMiddleware`'s
`JwtTenantResolver` has already cryptographically verified the same token for
tenant resolution, so a second signature check here would be pure waste) and
wraps `next()` in `store.run(userId, () => next())`. It is fail-open: a
missing/malformed token just means no current user for this request, never a
rejected request — that gate already exists upstream (`TenantMiddleware`
throws `AuthenticationFailedException` for non-excluded routes; `AuthGuard('jwt')`
independently gates specific routes needing RBAC).

`CqrsModule.forRoot()` binds `CURRENT_USER_PROVIDER` to
`AsyncLocalCurrentUserStore` via `useExisting` by default — this needs no
per-composition-root override (unlike `TENANT_RESOLVER`, which genuinely
differs between `HeaderTenantResolver` and `JwtTenantResolver`), since there
is exactly one correct implementation now. The `currentUserProviderOverride`
option is kept on `CqrsModuleOptions` for tests, not because production needs
to override it. `RequestCurrentUserProvider` and `NoopCurrentUserProvider`
are deleted — both are made obsolete by `AsyncLocalCurrentUserStore`, which
also correctly returns `undefined` outside of any `run()` call (e.g. for
`register-tenant`/`login`, which are `TenantMiddleware`-excluded and never
populate a current user).

### 5. `OrganizationController` / `OrganizationProfileController` gained `@UseGuards(AuthGuard('jwt'))`

A second, independent bug surfaced during end-to-end verification: these two
controllers had **no** guard at all. Tenant-scoping still worked (JWT
signature verification happens in `TenantMiddleware`, independent of
Passport), but `request.user` was never populated by Passport, and no
role-based restriction was ever actually enforced on any organization route
— any holder of any valid tenant JWT could perform any organization action
regardless of role. `AuthGuard('jwt')` is added at the controller level on
both. This is the generic `@nestjs/passport` guard factory (looked up by the
string `'jwt'` against Passport's process-wide strategy registry, populated
once by identity's `JwtStrategy`) — adding it to `organization-api` does
**not** create an `Nx scope:organization -> scope:identity` dependency edge;
only a generic npm package (`@nestjs/passport`) was added as a dependency.
No `@Roles()` restriction was added, since no per-route role policy for
organization commands has been specified yet — that remains a deliberate,
open follow-up (see Consequences).

## Alternatives Considered

- **Manually call an audit logger from inside each of the 19 handlers'
  `handle()` methods.** Rejected: guaranteed to be forgotten for the 20th
  handler an engineer writes next sprint; also means every future PR touching
  a handler needs a reviewer to remember to check for it. The base-class
  choke point makes it structurally impossible to add a new command handler
  without audit logging, since it's baked into `TransactionalCommandHandler`
  itself.
- **RLS-scope `audit_log` per tenant.** Rejected — same reasoning as
  `Tenant`/`User` in ADR-0005: pre-authentication events (failed login,
  tenant registration) have no tenant context yet, and RLS's `WITH CHECK`
  would reject those inserts outright.
- **Keep `RequestCurrentUserProvider`, fix by having `@nestjs/cqrs` resolve
  handlers per-request via `ContextIdFactory`/`moduleRef.resolve()`.**
  Rejected: `@nestjs/cqrs`'s handler explorer does not support this — it is a
  library-level limitation, not something fixable from application code
  without forking or monkey-patching the library. `AsyncLocalStorage` avoids
  the problem entirely rather than working around it.
- **A dedicated `CURRENT_USER_RESOLVER` interface + token (mirroring
  `TENANT_RESOLVER`/`ITenantResolver`) with a pluggable resolver, instead of a
  single hardcoded `CurrentUserMiddleware`.** Rejected as unnecessary
  complexity: unlike tenant resolution (which genuinely has two real
  strategies — header-based for dev/internal, JWT-based for production),
  current-user identification only ever has one correct source (the verified
  JWT's `sub` claim) once authentication exists at all. Pluggability with no
  second real implementation is speculative generality.

## Consequences

**Easier:** every future command handler gets audit logging automatically by
construction. `userId`/`tenantId` attribution now works correctly end-to-end,
verified via a live HTTP smoke test and a DB-level integration test
(`libs/audit/src/lib/audit-log.integration-spec.ts`) that also re-confirms
WORM immutability and the absence of an RLS policy on `audit_log`.

**Harder / follow-up work, explicitly flagged, not silently dropped:**

- **No role-based (`@Roles()`) restriction on any organization-suite route
  yet.** `AuthGuard('jwt')` now requires *a* valid, active, non-expired
  session, but any authenticated user of any role can perform any
  organization command. This needs an explicit per-route role policy
  decision in a future sprint (naturally, once HR/Employee data exists and
  role assignment is fully modeled).
- **`AsyncLocalCurrentUserStore` trusts the JWT's `sub` claim via a cheap
  `decode()`, not a fresh `verify()`.** This is safe only because
  `TenantMiddleware` already verified the same token's signature earlier in
  the same request's middleware chain for every non-excluded route. If a
  future route is ever excluded from `TenantMiddleware` but not from
  `CurrentUserMiddleware`, this assumption breaks silently (userId would be
  attributable from an unverified claim). Any new middleware-exclusion list
  must keep both middlewares' exclusions in sync.
- **No audit-log *read* API yet** (viewing/querying audit history is not
  exposed anywhere) — write-path only this sprint, by design (matches the
  sprint's WORM/compliance focus, not a reporting feature).
