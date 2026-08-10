# ADR-0001: Organize the platform as Enterprise Suites

- Status: Accepted
- Date: 2026-08-10
- Decision maker: Owner + Platform Council
- Context: The platform grew as a set of libraries and standalone modules. To scale across sectors and reach the 2035 vision, the platform needs a structuring model that is scalable and easy to extend, with clear ownership and measurable maturity — not a growing pile of modules.
- Options considered:
  1. **Status quo (standalone modules)** — cheapest now, but duplicates identity/payment/audit logic, fragments ownership, and blocks partner opening.
  2. **Enterprise Suites** — named boundaries (Core, Tenancy, Identity, Marketplace, Engagement, Payments, Integrations) that compose through contracts under one Constitution, each with an owner and an L0–L7 maturity level.
  3. **Full microservices split** — premature; high operating cost for the current team and scale.
- Decision: Adopt the **Enterprise Suites** model as the structuring principle of the platform. The existing monorepo (`libs/`, `apps/`) is the seed of the suites; suite evolution is measured via the L0–L7 model.
- Consequences:
  - Suites become the unit of ownership, APIs, and maturity tracking.
  - New sectors join by adding capabilities on the Core Platform, reusing Identity/Tenancy/Payments/Audit.
  - Platform Council reviews suite maturity quarterly (Chapter 8).
- Constitution check: Aligns with Vision (Ch2), Unity/Simplicity (Ch4), Architecture Principles 6.1–6.3 (Ch6), Governance (Ch8).
