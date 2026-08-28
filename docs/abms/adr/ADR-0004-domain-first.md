# ADR-0004: Domain First

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** Many platforms let database schema, UI frameworks, or technology trends drive design. ABMS must be driven by business domains.
- **Options considered:**
  1. Database-driven design
  2. UI-driven design
  3. Framework-driven design
  4. Domain-driven design (chosen)
- **Decision:** The business domain drives all design decisions. Database is persistence. UI is presentation. Framework is implementation. Business Domain is the source of truth.
- **Consequences:** Domain models are defined first. Database schemas derive from domain models. UIs derive from domain capabilities. Frameworks are interchangeable.
- **Constitution check:** Chapters 6 (Architecture Principles), 5 (Engineering Principles)
