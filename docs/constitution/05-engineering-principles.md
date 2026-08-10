# Chapter 5 — Engineering Principles

Engineering principles govern how code is written, reviewed, tested, and shipped. They are the Constitution applied at the repository level.

## 5.1 Security by default

- Secrets never enter the repository. `.env`, certificates, and keys are gitignored and rotated when exposed.
- Production boot fails fast if required secrets are missing — we do not run insecurely by accident.
- All user input is validated server-side; all authenticated routes are guarded; all tenants are isolated.
- `npm audit`, gitleaks, and CodeQL are part of CI, not optional afterthoughts.

## 5.2 Tests are part of the definition of done

- A change is not "done" until it is reviewed, tested, and builds cleanly.
- We run unit, integration, and end-to-end tests in CI across the monorepo.
- Tests protect the trust our users place in us — money and orders must never break silently.

## 5.3 Review everything

- Every change to a shared library or the mainline ships through pull request review.
- Reviewers check behaviour, security, and constitution alignment, not just syntax.
- A review is a conversation, not an obstacle; the standard is *Trust* and *Craftsmanship*.

## 5.4 Simplicity and smallest responsible solution

- Prefer the smallest change that solves the problem correctly.
- We reuse our own libraries before adding dependencies. Every new dependency is a liability we accept deliberately.
- We delete code that is no longer used. Dead code is tax.

## 5.5 Ownership and accountability

- The team that builds a suite owns it in production: its metrics, its errors, its recovery.
- Outages are followed by blameless post-mortems and written cause records.
- Every service is observable: structured logs, metrics, and tracing (see our `core-tracing`/`core-audit` foundations).

## 5.6 Incremental delivery

- We ship small, frequent, deployable increments.
- We do not wait for perfection; we wait for correctness, then iterate.
- Features are released behind safe, reversible steps where it matters.

## 5.7 Documentation is code

- Decisions are recorded (ADRs), APIs are documented, and this Constitution is version-controlled.
- A feature that cannot be explained in a few clear sentences is not ready to ship.
- Documentation grows with the system; a system that changes without its docs changing is a system in decline.

## 5.8 No heroics

- No single person is indispensable. Knowledge is shared through reviews, pairing, and written records.
- We prefer boring, reliable technology we understand over exotic technology we admire.

## 5.9 Long-term maintenance

- Dependency upgrades (including security patches) are treated as first-class work, not chores.
- We keep the build green: if CI is red, fixing CI is the highest priority.
- Compatibility with our own consumers is respected; breaking changes require a migration path and a recorded decision.
