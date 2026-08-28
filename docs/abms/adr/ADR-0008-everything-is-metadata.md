# ADR-0008: Everything is Metadata

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision maker:** Owner
- **Context:** Hardcoded forms, validations, permissions, and workflows create rigid systems that require code changes for business adjustments.
- **Options considered:**
  1. Hardcoded business UI and logic
  2. Metadata-driven configuration (chosen)
- **Decision:** Fields, Forms, Validation, Permissions, Reports, Dashboards, and Workflows are defined as metadata, not hardcoded. Metadata originates from the Business Ontology, not directly from the database.
- **Consequences:** Metadata Engine becomes a core capability. Dynamic UI generation becomes possible. Business users can configure behavior without code changes. Metadata versioning is required.
- **Constitution check:** Chapters 6 (Architecture Principles), 7 (Product Principles)
