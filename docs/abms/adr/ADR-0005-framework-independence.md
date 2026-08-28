# ADR-0005: Framework Independence

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** Technology frameworks change every 2-5 years. ABMS architecture must outlive any specific framework.
- **Options considered:**
  1. Tight coupling with NestJS
  2. Framework-independent domain layer (chosen)
- **Decision:** Today NestJS. Tomorrow .NET, Java, Rust, Go. The domain layer must not care about the framework. Business logic is framework-agnostic.
- **Consequences:** Domain layer has zero framework dependencies. Infrastructure layer adapts domain to framework. Migration between frameworks is possible without rewriting business logic.
- **Constitution check:** Chapters 5 (Engineering Principles), 6 (Architecture Principles)
