# ADR-0007: Everything is an Entity

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** Traditional class hierarchies create rigid, hard-to-extend systems. ABMS needs a flexible entity model that supports dynamic registration.
- **Options considered:**
  1. Traditional class hierarchy
  2. Entity Registry pattern (chosen)
- **Decision:** Customer is not a class. Budget is not a class. Hospital is not a class. All are Entities registered in a Universal Business Registry. Entities are dynamic, discoverable, and metadata-driven.
- **Consequences:** Universal Business Registry becomes the foundation. Metadata engine drives UI, validation, permissions, and workflows. New entity types can be added without code changes.
- **Constitution check:** Chapters 6 (Architecture Principles)
