# ADR-0001: ABMS is an Enterprise Business Operating Platform

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** ABMS must be clearly differentiated from ERP systems, accounting software, and single-purpose applications. The platform identity must be established from day one.
- **Options considered:**
  1. ERP System (like SAP, Oracle)
  2. Business Management Application
  3. Enterprise Business Operating Platform (chosen)
- **Decision:** ABMS is an Enterprise Business Operating Platform (EBOP). It is not an ERP. It is not accounting software. It is not a hospital system. It is not a government system. It is an Operating Platform on which multiple business domains live.
- **Consequences:** Every architectural decision must reinforce the "platform" identity. Modules are not standalone features — they are capabilities that compose on the platform. The UI is the last layer, not the first.
- **Constitution check:** Chapters 1 (Identity), 2 (Vision), 6 (Architecture Principles)
