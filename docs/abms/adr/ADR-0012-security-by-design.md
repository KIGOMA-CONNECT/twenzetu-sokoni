# ADR-0012: Security by Design

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** Security cannot be an afterthought. It must be designed into every capability from day one.
- **Options considered:**
  1. Security as a feature (bolt-on)
  2. Security as a foundational capability (chosen)
- **Decision:** Default deny. RBAC. ABAC (future). Field level security. Row level security. Audit trail. Encryption. Secrets management. Security review before production release.
- **Consequences:** Every endpoint requires authentication by default. Every entity requires authorization. Every financial action requires audit trail. Encryption at rest and in transit. Secrets never in code.
- **Constitution check:** Chapters 4 (Core Values), 5 (Engineering Principles)
