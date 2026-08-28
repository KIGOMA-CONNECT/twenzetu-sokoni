# ADR-0010: Configuration over Customization

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** Customers should not need to modify source code to adapt ABMS to their needs.
- **Options considered:**
  1. Source code customization
  2. Configuration-driven adaptation (chosen)
- **Decision:** ABMS adapts through configuration, not code modification. Every capability is: Plugin, Extension, Event, API. Marketplace can add functionality without changing the Kernel.
- **Consequences:** Configuration platform becomes essential. Configuration is version-controlled. Configuration changes are audited. Configuration is tenant-aware.
- **Constitution check:** Chapters 6 (Architecture Principles), 7 (Product Principles)
