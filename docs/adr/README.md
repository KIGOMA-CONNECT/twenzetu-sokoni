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
