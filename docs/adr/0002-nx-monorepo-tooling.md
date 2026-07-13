# ADR-0002: Nx as the monorepo tool

**Status:** Accepted

**Date:** 2026-07-07 (Sprint 1 — Foundation)

## Context

ABMS's Clean Architecture requirement (Constitution Chapter 6) means Domain,
Application, Infrastructure, and Presentation code for every business module
must live in separately buildable packages with a strictly enforced,
one-directional dependency graph — Domain must never be able to import
Infrastructure, for example. As the Enterprise Capability Map (Chapter 6)
fills in over time, the workspace is expected to grow to dozens of bounded
contexts, each split into 3–4 layered libraries.

## Decision

Use **Nx** as the monorepo tool, over a plain NestJS monorepo (`nest-cli.json`
apps/libs) or plain npm workspaces. Package manager is **npm** (a fixed
project requirement — every sprint must end with `npm run build` green).

Dependency direction between foundation libraries and business modules is
enforced two ways:

1. Nx project tags (`scope:*`, `type:domain`/`type:infrastructure`/`type:app`)
   with `@nx/enforce-module-boundaries` `depConstraints`, checked under
   `nx lint`.
2. A `no-restricted-imports` ESLint rule scoped to `libs/kernel/**` banning
   direct imports of `@nestjs/*`, `typeorm`, `express`, and `rxjs` — because
   the Nx tag rule only governs imports *between* Nx libraries, not raw
   npm-package imports.

## Alternatives Considered

- **Plain NestJS monorepo (`nest-cli.json` apps/libs).** Simpler, no external
  tooling dependency — but has no dependency-graph enforcement or
  affected-build tooling, meaning the Domain-cannot-import-Infrastructure
  rule from Chapter 6 would rely entirely on manual code review at every
  module boundary, indefinitely.
- **Plain npm/pnpm workspaces.** No real build-system beyond TypeScript
  project references; same enforcement gap as above, without even Nx's
  caching/affected-build benefits.

## Consequences

- Every new library has real per-lib scaffolding cost (`tsconfig.lib.json`,
  `project.json`, its own `package.json`) — accepted deliberately in exchange
  for the boundary guarantees.
- `npm run build` succeeding does **not** by itself prove the architecture
  boundaries hold — only `nx lint` checks the `depConstraints`. `npm run
  verify` (build + lint + test) is therefore the real per-sprint
  Definition of Done, not `npm run build` alone, even though the latter is
  the project's literal hard requirement.
- A real, reproducible Nx/TypeScript tooling bug was discovered during Sprint
  2: any Nx library nested more than 3 path segments deep under `libs/`
  (e.g. `libs/modules/organization/domain`) causes `@nx/js:tsc`'s `rootDir`
  inference to compute a corrupted path on this environment, breaking every
  cross-lib import with `TS6059`. All business-module libraries are therefore
  kept at exactly `libs/<module>/<layer>` (3 segments) — never nested under an
  extra grouping folder.
