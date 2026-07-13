# ADR-0004: Org unit type profiles and shared financial value objects

**Status:** Accepted

**Date:** 2026-07-13 (Sprint 3 — Company/Branch/Department/Cost Center/Profit Center)

## Context

Sprint 2 built a generic Org Unit Tree Engine where `OrgUnitType` is data (a
tenant-scoped table), not a hardcoded enum — the same 14 default types
(including `COMPANY`, `BRANCH`, `DEPARTMENT`, `COST_CENTER`, `PROFIT_CENTER`)
were seeded with no type-specific fields or business rules, deliberately out
of scope for that sprint. Sprint 3's roadmap item is to give five of those
types real data: a Company needs tax registration and a functional currency;
a Branch needs a physical address and may operate in a different currency
than its parent company; a Cost Center needs a budget; a Profit Center needs
a revenue target; a Department needs an optional cost-center rollup link.
This data must not require touching or widening the generic `OrgUnit`/
`OrgUnitType` aggregates from Sprint 2, and multi-currency/tax-registration
data of this shape will recur in every future financial module (Sales,
Purchasing, Payroll, GL) — not just Organization.

## Decision

1. **One 1:1 "profile" aggregate per type**, each a separate `AggregateRoot`
   (`CompanyProfile`, `BranchProfile`, `DepartmentProfile`,
   `CostCenterProfile`, `ProfitCenterProfile`) keyed by a unique `org_unit_id`
   foreign key `ON DELETE RESTRICT` (matching `org_unit`'s own FK style).
   Each has its own repository interface/implementation, own migration, and
   no domain events (nothing subscribes to `OrgUnitType`'s mutations either,
   so raising events here would be speculative infrastructure with no
   consumer). All five live inside the existing `libs/organization/*` Nx
   libraries, under new `profiles/` subfolders — this is still the
   Organization bounded context, and five new Nx libraries for what is
   fundamentally the same context would be over-fragmentation.

2. **`Money`, `CurrencyCode`, `CountryCode`, `TaxIdentifier`, and `Address`
   now live in `libs/kernel`** as shared value objects, next to the existing
   `TenantId` (the established precedent for "widely-reused VO with zero
   framework deps"). `CurrencyCode`/`CountryCode` validate against real,
   complete ISO 4217 / ISO 3166-1 alpha-2 code lists. `Money.amount` is a
   **decimal string** (regex-validated, non-negative, ≤4 fraction digits)
   rather than a float or integer minor units — Postgres `numeric(18,4)`
   columns already round-trip through `pg`/TypeORM as strings by default, so
   this avoids a float-precision bug for free and avoids needing a
   per-currency decimal-places lookup table.

3. **Type-binding is an application-layer check, not a schema constraint.**
   A profile may only attach to an `OrgUnit` whose `OrgUnitType.code` matches
   (e.g. a `CompanyProfile` requires `code === 'COMPANY'`). Since
   `OrgUnitType.code` is mutable tenant data — a tenant could in principle
   rename it via the existing `CreateOrgUnitTypeCommand`/a future rename
   command — there is no cross-table CHECK constraint in Postgres that could
   enforce this, and a database trigger would be new, inconsistent infra
   this project doesn't use anywhere else. Instead, every
   `Create<X>Profile` handler loads the `OrgUnit` and its `OrgUnitType` and
   calls a single shared helper, `assertOrgUnitType(orgUnit, orgUnitType,
   expectedCode)`, which throws `BusinessRuleViolationException` on
   mismatch. `DepartmentProfile`'s optional `costCenterOrgUnitId` link reuses
   the same helper to confirm the referenced unit is type `COST_CENTER`.

## Alternatives Considered

- **Add nullable columns directly to `OrgUnit`.** Rejected — violates the
  "don't touch the Sprint 2 generic engine" constraint, and would make
  `OrgUnit` an ever-widening junk-drawer table as more types are added in
  future sprints (there is no natural stopping point).
- **A single generic EAV/JSON `metadata` column on `OrgUnit`.** Rejected —
  loses type safety, FK integrity (e.g. `costCenterOrgUnitId` needs a real
  foreign key), and CHECK constraints (e.g. the budget-period-end-after-start
  rule); an event-sourcing or schema-registry approach was also considered
  and rejected as out of scope for what is fundamentally a handful of
  strongly-typed extension tables.
- **Enforce type-binding via a database trigger.** Rejected as new,
  inconsistent infrastructure — every other piece of business logic in this
  codebase lives in TypeScript command handlers or migration-only SQL, never
  in a trigger.
- **Integer minor units for `Money`.** Rejected for this sprint as scope
  explosion — correct minor-units handling needs a per-currency
  decimal-places table (JPY has 0, most have 2, a few have 3), which is a
  legitimate future refinement once a real accounting/GL module needs it,
  not something to invent speculatively here.

## Consequences

- Every future financial module reuses `Money`/`CurrencyCode`/`CountryCode`
  from `libs/kernel` instead of reinventing them — this is the intended
  payoff of putting them in the shared kernel now rather than scoping them to
  Organization.
- The type-binding check must be copy-pasted (via the shared
  `assertOrgUnitType` helper, at least) into every profile-create handler
  and into `DepartmentProfile`'s cost-center-link validation — a genuine,
  accepted, and documented limitation: if a tenant renames an `OrgUnitType`'s
  `code` after profiles already exist against it, those existing profiles
  are not retroactively invalidated. This mirrors how `OrgUnit.reparent`'s
  allowed-parent-type check is also only enforced at move-time, not
  continuously.
- `TaxIdentifier` has no per-country tax-number format validation (only
  non-empty, bounded length) — flagged as future work, not a defect.
- `managerReference` (`DepartmentProfile`) and `glAccountCode`
  (`CostCenterProfile`/`ProfitCenterProfile`) are explicit stopgap plain
  string/id fields pending a future Identity/User module and a future
  GL/Accounting module respectively — matching this project's existing
  stopgap-flagging style (parallel to the Sprint 2 seeder's hardcoded
  `DEFAULT_TENANT_ID`).
- While building the integration test for these five tables, two real,
  pre-existing bugs were found and fixed in
  `org-unit-closure.integration-spec.ts` (Sprint 2's own committed test,
  never previously run to a green result in this environment): the test's
  `DataSource` was missing an `entities` list (causing
  `EntityMetadataNotFoundError`), and its owner-role raw queries
  (`fetchClosureRows`, `afterAll` cleanup) never set the `app.tenant_id` GUC,
  so `FORCE ROW LEVEL SECURITY` silently filtered them to zero rows/zero
  deletes — the same bug class ADR-0001 already documents for the Sprint 2
  seeder. Both integration spec files now set the tenant GUC before any
  owner-role read or write.
