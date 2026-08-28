# ADR-0003: API First

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** Business logic must be accessible through multiple channels without duplication. APIs must be first-class products.
- **Options considered:**
  1. UI-first with API as afterthought
  2. API-first with UI consuming APIs (chosen)
- **Decision:** Every capability must be accessible through stable, versioned APIs: REST, GraphQL, gRPC, Events, SDK. No business logic lives in controllers. APIs are products with their own documentation, versioning, and lifecycle.
- **Consequences:** Controllers are thin. Business logic lives in services. Every API endpoint has OpenAPI documentation. API versioning follows semver. Breaking changes follow deprecation policy.
- **Constitution check:** Chapters 5 (Engineering Principles), 6 (Architecture Principles)
