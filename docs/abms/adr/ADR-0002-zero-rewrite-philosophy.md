# ADR-0002: Zero Rewrite Philosophy

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** Many enterprise platforms suffer from periodic rewrites that lose institutional knowledge, break integrations, and waste years of engineering investment.
- **Options considered:**
  1. Periodic rewrites (common in startups)
  2. Continuous evolution with versioning (chosen)
- **Decision:** ABMS will never undergo a full rewrite. Instead, the platform evolves through: Evolution, Versioning, Deprecation, Migration.
- **Consequences:** Every breaking change must have a migration path. Every deprecated API must have a replacement before deprecation. Every module version must be backward compatible within major versions.
- **Constitution check:** Chapters 5 (Engineering Principles), 6 (Architecture Principles)
