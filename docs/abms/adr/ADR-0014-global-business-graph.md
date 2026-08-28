# ADR-0014: ABMS Global Business Graph

- **Status:** Proposed
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** ABMS should not just be a business management tool — it should connect businesses with opportunities globally.
- **Options considered:**
  1. Standalone business management per tenant
  2. Global Business Intelligence Network (chosen)
- **Decision:** ABMS will build a Global Business Graph connecting:
  - Entrepreneurs seeking capital
  - Investors seeking opportunities
  - Banks seeking creditworthy businesses
  - NGOs seeking beneficiaries
  - Governments seeking compliant businesses
  - Suppliers seeking buyers
  - Buyers seeking suppliers

  Intelligence, not keywords, drives the connections.

- **Consequences:** Semantic layer required (Business Ontology). Entity relationships must be machine-readable. AI must be able to reason over the graph. Privacy controls must govern data sharing. Graph evolves with each tenant's data.
- **Constitution check:** Chapters 2 (Vision), 6 (Architecture Principles)
