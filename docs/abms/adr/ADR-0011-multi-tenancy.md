# ADR-0011: Multi-Tenancy as Core Architecture

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** ABMS must serve multiple organizations on a single platform instance with strict data isolation.
- **Options considered:**
  1. Database-per-tenant
  2. Schema-per-tenant
  3. Row-level security with tenant context (chosen)
- **Decision:** Tenant is an execution boundary, not a customer. Every entity carries tenant context. Row-level security enforces isolation. Tenant hierarchy: Tenant → Company → Branch → Department → Business Unit → User.
- **Consequences:** Tenant middleware extracts tenant context from every request. All queries are tenant-scoped. Tenant data is never leaked across boundaries. Tenant configuration is isolated.
- **Constitution check:** Chapters 6 (Architecture Principles)
