# ADR-0002: Pin security patches via npm overrides

- Status: Accepted
- Date: 2026-08-10
- Decision maker: Platform Council
- Context: GitHub dependabot flagged 13 vulnerabilities (8 high) across transitive dependencies with no compatible direct upgrade: `react-router` (7.18.2), `js-yaml` (3.15.1 / 4.3.1 / 5.2.2 across three major lines), `nx` (23.0.2, which also pins `axios` 1.16.0 and `brace-expansion` 5.0.6), `fast-uri` (3.1.5), `postcss` (8.5.23), and `brace-expansion` (1.1.18 / 2.1.4 / 5.0.9 per `minimatch` line). Several parents declare exact versions, so `npm audit fix` could not resolve them without breaking downgrades.
- Options considered:
  1. `npm audit fix --force` — proposed breaking downgrades (`@nx/jest@22.7.1`, `@nx/webpack@22.5.4`); rejected.
  2. **Scoped npm overrides** — force patched versions per parent/version line while keeping all parents' APIs compatible; regenerated the lockfile.
  3. Do nothing — rejected; 8 high vulnerabilities exposed to dependabot.
- Decision: Add an `overrides` block in the root `package.json` scoped per parent (`js-yaml` by consumer major), version-scoped where majors must differ (`brace-expansion@^1.1.7`, `@^2.0.2`, `@^5.0.5`), and a nested override on `nx` (itself → 23.0.2, `axios` → 1.18.1). Verified with full `npm run build`, `npm run lint`, and `npm run test` (all green).
- Consequences:
  - `npm audit` reduced to one accepted residual (`image-size`, build-time only, no patched version exists; tracked in README).
  - Overrides are the documented mechanism for urgent transitive security patches; the root project still owns all ranges.
  - Future dependency upgrades should aim to remove overrides by raising direct ranges where possible.
- Constitution check: Trust/Security and Craftsmanship (Ch4), Engineering Principles 5.1 and 5.9 (Ch5).
