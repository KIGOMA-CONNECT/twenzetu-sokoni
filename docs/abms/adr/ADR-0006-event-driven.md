# ADR-0006: Event Driven

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** Direct platform-to-platform calls create tight coupling, circular dependencies, and cascading failures.
- **Options considered:**
  1. Synchronous inter-platform calls
  2. Event-driven communication via Event Bus (chosen)
- **Decision:** No platform calls another platform directly. Finance does not call Inventory. Inventory does not call HR. All communication happens through the Event Bus. Business events are first-class citizens.
- **Consequences:** Every platform publishes domain events. Every platform subscribes to events it cares about. Event schemas are versioned. Event replay is supported. Debugging requires event tracing.
- **Constitution check:** Chapters 6 (Architecture Principles)
