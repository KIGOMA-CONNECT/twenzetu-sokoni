# Architecture Decision Records (ADR)

Per [`docs/CONSTITUTION.md`](../CONSTITUTION.md) Chapter 9 ("Decision
Framework"), every significant architecture decision — anything expensive to
reverse, such as a data model shape, a multi-tenancy strategy, a monorepo
tooling choice, or a cross-module contract — must be recorded here.

## When to write an ADR

Write one when a decision meets any of these:

- Reversing it later would require touching many modules or migrating data.
- It constrains what future modules can do (e.g. a storage strategy, a
  boundary rule, a package-manager or tooling choice).
- A reasonable alternative was seriously considered and rejected — the
  reasoning is worth preserving.

Do **not** write one for ordinary implementation details (a function name, a
file's internal structure, a routine bug fix) — see Constitution Chapter 9's
three decision tiers.

## Process

1. Copy [`template.md`](./template.md) to `NNNN-short-title.md`, where `NNNN`
   is the next sequential number (zero-padded to 4 digits).
2. Fill in Context, Decision, Alternatives Considered, and Consequences.
3. Status starts as `Proposed`. Once implemented and merged, update it to
   `Accepted`. If a later ADR reverses this one, mark the old one
   `Superseded by ADR-NNNN` rather than deleting it — the history is the
   point.

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](./0001-shared-schema-row-level-security-multi-tenancy.md) | Shared-schema multi-tenancy via PostgreSQL Row-Level Security | Accepted |
| [0002](./0002-nx-monorepo-tooling.md) | Nx as the monorepo tool | Accepted |
| [0003](./0003-adjacency-list-plus-closure-table-for-organization-hierarchy.md) | Adjacency list + closure table for the Organization hierarchy | Accepted |
| [0004](./0004-org-unit-type-profiles-and-shared-financial-value-objects.md) | Org unit type profiles and shared financial value objects | Accepted |
| [0005](./0005-non-rls-identity-tables-and-jwt-tenant-resolution.md) | Non-RLS identity tables and JWT-based tenant resolution | Accepted |
| [0006](./0006-audit-worm-and-async-local-current-user-context.md) | Audit/WORM logging and AsyncLocalStorage-based current-user context | Accepted |
| [0007](./0007-workflow-engine-v1-sequential-approval-chain.md) | Workflow Engine v1 — sequential, role-based approval chain | Accepted |
| [0008](./0008-core-hr-employee-master-data.md) | Core HR — employee master data, positions, employment history, documents | Accepted |
| [0009](./0009-leave-attendance-v1.md) | Leave & Attendance v1 — balances, requests, clock in/out | Accepted |
| [0010](./0010-payroll-v1-statutory-payroll-engine.md) | Payroll v1 — salary structures, payroll periods, payslips (Tanzania statutory engine) | Accepted |
| [0011](./0011-recruitment-onboarding-v1.md) | Recruitment & Onboarding v1 — job requisitions, candidates, applications, onboarding tasks | Accepted |
| [0012](./0012-performance-management-v1.md) | Performance Management v1 — goals, review cycles, performance reviews | Accepted |
| [0013](./0013-offboarding-v1.md) | Offboarding v1 — exit cases, checklist tasks, employee termination | Accepted |
| [0014](./0014-compensation-benefits-v1.md) | Compensation & Benefits v1 — salary revisions, benefit plans, enrollments | Accepted |
