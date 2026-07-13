# ADR-0003: Adjacency list + closure table for the Organization hierarchy

**Status:** Accepted

**Date:** 2026-07-11 (Sprint 2 — Organization Module)

## Context

The Organization module must model a hierarchy that spans Organization,
Company, Division, Business Unit, Department, Section, Team, Branch,
Warehouse, Project, Region, Zone, Cost Center, and Profit Center — required to
be **dynamic and metadata-driven** rather than hardcoded (Constitution
Chapter 7, "configuration is a product surface"). The tree must support fast
arbitrary-depth reads (render a full org tree, resolve a cost-center rollup,
compute a breadcrumb) at the scale the platform targets (thousands of
tenants), while writes (reorgs — moving a subtree to a new parent) are
comparatively rare.

## Decision

Model the hierarchy with two structures working together:

- **Adjacency list** (`org_unit.parent_id`) as the single source of truth for
  the tree shape — simple to reason about, cheap to update.
- **Closure table** (`org_unit_closure`: `ancestor_id`, `descendant_id`,
  `depth`), maintained transactionally alongside every create/reparent, giving
  O(1) indexed-range queries for "all descendants of X" or "all ancestors of
  X" without recursive CTEs or per-level round trips.

`OrgUnitType` is itself data (a tenant-scoped table with an
`org_unit_type_allowed_parent` join table), not a hardcoded TypeScript enum —
matching the metadata-driven requirement directly.

Reparenting a subtree runs three steps inside one transaction: delete the
closure rows that cross between the node's old ancestors and its subtree,
insert new closure rows via a supertree/subtree cross join against the new
parent's ancestor chain, then update `parent_id` with an optimistic-lock
version check. A cycle guard (a single closure-table existence check) runs
before any mutation and rejects both a self-move and a move into the node's
own descendant.

## Alternatives Considered

- **Adjacency list only, with recursive CTEs.** Simplest schema, but subtree
  and ancestor queries get slower as trees get deep/wide, and there is no
  second structure to maintain — rejected because read performance at scale
  matters more than write simplicity for this access pattern.
- **Materialized path** (a `path` string column). Fast subtree reads via
  `LIKE 'path%'`, but moving a node with many descendants requires rewriting
  every descendant's path string — expensive exactly when a reorg happens,
  which real organizations do periodically.
- **Nested sets** (`lft`/`rght`). The fastest possible reads (a single range
  query), but *every* insert or move requires renumbering a potentially large
  span of the tree — the worst option of the four for write cost, and
  reorgs are not rare enough to justify it.

## Consequences

- Every closure-table row must carry the correct `tenant_id`, matching
  ADR-0001's RLS strategy — a mistake here would corrupt cross-tenant
  tree/breadcrumb data, which is worse than a normal RLS gap since it
  wouldn't just leak rows, it would misrepresent whose rows they are.
- Large subtree moves are one bulk SQL statement (not N round-trips) but are
  still O(ancestors × subtree size) rows written — acceptable at the scale
  validated so far; a candidate for chunking if a future tenant's real usage
  shows it becoming slow.
- All closure-table mutations are raw parameterized SQL via
  `EntityManager.query()`, not TypeORM's `QueryBuilder` — this is inherently
  bulk, set-based SQL that `QueryBuilder`'s entity-metadata-driven API is not
  built for, and it matches the existing house style used by the RLS helper
  itself.
- Proven end-to-end against real PostgreSQL by
  `libs/organization/infrastructure`'s closure-table integration test: a
  4-level tree, a subtree reparent with an intermediate sibling, and both a
  self-move and a into-own-descendant move rejected with the closure table
  byte-for-byte unchanged afterward.
