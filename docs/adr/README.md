# Architecture Decision Records

Decision records are the mechanism the Constitution's [Decision Framework](constitution/09-decision-framework.md) uses to make governance traceable. A decision without a record is a rumour.

## Format

Every ADR follows this template (from Chapter 9.3):

```markdown
# ADR-NNNN: <Title>

- Status: Proposed | Accepted | Superseded by ADR-####
- Date: <ISO date>
- Decision maker: <Owner | Council | Suite maintainer>
- Context: <The problem and constraints>
- Options considered: <List with brief pros/cons>
- Decision: <The choice and why>
- Consequences: <What this enables and what it costs>
- Constitution check: <Chapters 2–7 alignment>
```

## Records

| ADR | Title | Status | Date |
|---|---|---|---|
| [ADR-0001](ADR-0001-enterprise-suites.md) | Organize the platform as Enterprise Suites | Accepted | 2026-08-10 |
| [ADR-0002](ADR-0002-dependency-security-overrides.md) | Pin security patches via npm overrides | Accepted | 2026-08-10 |
| [ADR-0003](ADR-0003-payments-fail-closed.md) | Payment providers fail closed when unconfigured | Accepted | 2026-08-10 |
| [ADR-0004](ADR-0004-azampay-primary-aggregator.md) | AzamPay as the primary payment aggregator | Accepted | 2026-08-10 |
| [ADR-0005](ADR-0005-cargo-binding-fare-and-instant-booking.md) | Cargo, Express & Logistics — server-side binding fare and instant booking | Accepted | 2026-08-11 |
| [ADR-0006](ADR-0006-marketing-catalog-public-ads-share-links.md) | Marketing catalog data, public ads API, and shareable category links | Accepted | 2026-08-11 |
| [ADR-0007](ADR-0007-ussd-hardening-notification-routing.md) | USSD production hardening and stable notification routing | Accepted | 2026-08-14 |
| [ADR-0008](ADR-0008-beem-ussd-hub-integration.md) | Beem USSD Hub integration | Accepted | 2026-08-14 |
| [ADR-0009](ADR-0009-marketing-campaigns-vendor-marketing-console.md) | Marketing campaigns (SMS broadcasts) and vendor marketing console | Accepted | 2026-08-18 |
