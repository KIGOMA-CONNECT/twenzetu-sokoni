# ADR-0013: Business Constitution per Bounded Context

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** Business rules scattered across controllers, services, and repositories create maintenance nightmares and make behavior unpredictable.
- **Options considered:**
  1. Rules scattered across codebase
  2. Business Constitution per bounded context (chosen)
- **Decision:** ABMS will not allow business rules to scatter across the codebase. Each bounded context has its own Business Constitution defining: invariants, policies, lifecycle, permissions, state transitions, compliance requirements.
- **Examples:**
  - Tenant Constitution — ACTIVE, SUSPENDED, ARCHIVED states and transitions
  - Finance Constitution — chart of accounts, fiscal periods, posting rules
  - Inventory Constitution — stock movements, valuation methods, reorder rules
  - Healthcare Constitution — patient records, consent, compliance
- **Consequences:** Business rules are centralized per domain. Rules are testable in isolation. Rules are auditable. Rules are version-controlled.
- **Constitution check:** Chapters 6 (Architecture Principles)
