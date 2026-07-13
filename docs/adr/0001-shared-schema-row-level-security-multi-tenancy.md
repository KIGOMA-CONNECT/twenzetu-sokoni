# ADR-0001: Shared-schema multi-tenancy via PostgreSQL Row-Level Security

**Status:** Accepted

**Date:** 2026-07-07 (Sprint 1 — Foundation)

## Context

ABMS must scale to thousands of tenants, millions of users, and multiple
countries (Constitution Chapters 2 and 7 — multi-tenancy is a core
architectural capability, not a feature toggle). Every tenant-scoped table in
the platform needs strong isolation guarantees: a bug in one query must never
be able to leak another tenant's data.

## Decision

Use **one shared PostgreSQL database and schema** for all tenants. Every
tenant-scoped table carries a `tenant_id` column and has PostgreSQL
**Row-Level Security** enabled and **forced** (`FORCE ROW LEVEL SECURITY` —
not just `ENABLE`, which does not apply to the table-owning role). A policy on
each table restricts every row to `tenant_id = current_setting('app.tenant_id')`.
The application sets that session variable once per transaction, via
`TenantAwareUnitOfWork`, using an `AsyncLocalStorage`-backed tenant context
that is populated per HTTP request by `TenantMiddleware`.

Two distinct PostgreSQL roles are provisioned: an `abms_owner` role (runs
migrations, owns the schema) and a non-`BYPASSRLS` `abms_runtime` role (used
by the running application's connection pool). This closes the gap where a
single superuser-like role would silently bypass RLS.

A repository base class (`TypeOrmRepository`) is structurally unable to
construct a query outside a transaction that has already set the tenant GUC,
so tenant-scoped data access without an active tenant context is not just
policy — it is impossible to write correctly by accident.

## Alternatives Considered

- **Schema-per-tenant.** Strong isolation, but migrations and connection
  pooling both fan out per tenant. Does not scale cleanly past a few hundred
  tenants — directly in tension with the "thousands of tenants" requirement.
- **Database-per-tenant.** Highest isolation (suitable for e.g. banking-grade
  regulatory requirements), but the operational cost (one DB instance per
  tenant) does not scale to thousands of tenants either, and was rejected for
  the same reason as schema-per-tenant.

## Consequences

- Reads/writes on tenant-scoped tables always go through a transaction that
  sets `app.tenant_id` first — this is the single most safety-critical rule
  in the persistence layer and is verified by an integration test
  (`libs/database`'s RLS isolation suite) that proves cross-tenant reads
  return zero rows and cross-tenant writes are rejected at the database
  level, not just in application code.
- A real Postgres quirk had to be worked around: a custom GUC reverts to an
  empty string (not `NULL`) after a `SET LOCAL` transaction ends, so RLS
  policies use `NULLIF(current_setting(...), '')` to fail closed instead of
  throwing a type-cast error. This is documented inline in
  `libs/database/src/lib/migrations/support/rls-helper.ts`.
- Every future migration that creates a tenant-scoped table **must** call the
  shared `enableRowLevelSecurity()` helper — there is no exception path.
- Any code that calls `dataSource.query()`/`dataSource.manager` directly
  (bypassing the unit of work) for a tenant-scoped table silently reintroduces
  leak risk. This cannot yet be enforced by a lint rule — it is a standing
  manual-review concern for all future modules.
