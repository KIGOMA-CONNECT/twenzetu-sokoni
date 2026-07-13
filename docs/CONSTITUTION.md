# ABMS Enterprise Constitution

**Version 1.0**

This is not a technical specification, a user manual, or a README. It is the
Constitution — the document every other decision in this repository must be
consistent with. When an architecture choice, a feature scope, or a technology
adoption is in question, this is the document to check first.

---

## Chapter 1 — Our Identity

### Who We Are

ABMS (African Business Management System) is an Enterprise Business Operating
Platform designed to provide organizations with a unified digital foundation
for managing business operations, governance, financial resources, human
capital, customer relationships, assets, supply chains, analytics, and
intelligent automation.

*Kwa Kiswahili:* ABMS ni jukwaa la uendeshaji wa biashara (Enterprise Business
Operating Platform) linalolenga kutoa msingi mmoja wa kidijitali unaowezesha
taasisi kusimamia shughuli zake, rasilimali, fedha, watu, wateja, mali, ugavi,
uchambuzi wa taarifa, na matumizi ya akili bandia kwa ufanisi na usalama.

ABMS is a **platform**, not an application. Working names for the ecosystem
this platform is meant to grow into include "ABMS Enterprise Platform" and
"ABOS — African Business Operating System." The eventual claim is deliberately
ambitious: *the world's first AI-native Enterprise Business Operating System*
— engineered in Africa, to global standards, for organizations everywhere.

### What We Believe

Businesses should spend their time creating value for customers — not
struggling with disconnected systems, duplicated data, and fragmented
processes.

*Kwa Kiswahili:* Biashara zinapaswa kutumia muda wake kuongeza thamani kwa
wateja, si kupoteza muda kushughulikia mifumo isiyounganishwa, taarifa
zilizorudiwa, na michakato iliyokatika.

### Our Purpose

We do not simply build software. We build trusted digital infrastructure that
enables organizations to operate efficiently, make informed decisions, and
innovate with confidence.

*Kwa Kiswahili:* Tunajenga miundombinu ya kidijitali inayowezesha taasisi
kufanya kazi kwa ufanisi, kufanya maamuzi yanayotegemea taarifa sahihi, na
kuendelea kubuni kwa kujiamini.

---

## Chapter 2 — Vision

> To become the world's most trusted Enterprise Business Operating Platform
> originating from Africa, empowering organizations of every size through
> secure, intelligent, and extensible digital technology.

*Kwa Kiswahili:* Kuwa jukwaa linaloaminika zaidi duniani la uendeshaji wa
biashara, lililoanzia Afrika, linalowezesha taasisi za ukubwa wote kutumia
teknolojia salama, janja, na inayoweza kupanuliwa.

Three words carry the weight of this vision, and every architecture decision
in this codebase should be measurable against them:

| Pillar | What it demands of the system |
|---|---|
| **Trusted** | Data integrity, security-by-design, auditability, predictable behavior, no silent data loss — ever. |
| **Intelligent** | Every capability should be AI-ready; automation and insight should be native, not bolted on. |
| **Extensible** | New domains, channels, and tenants must be addable without rewriting the foundation. |

By 2035, ABMS should be recognized as one of the world's leading enterprise
platforms — originating from Africa, engineered to global standards, and
trusted by organizations of every size, from startups to governments.

The vision is intentionally broader than ERP: businesses, governments, NGOs,
healthcare institutions, and educational institutions across both emerging and
developed markets are all in scope for what this platform should eventually
serve.

---

## Chapter 3 — Mission

> To engineer enterprise platforms that simplify business operations,
> strengthen governance, enhance decision-making, and accelerate sustainable
> growth through world-class software engineering.

*Kwa Kiswahili:* Kubuni na kujenga majukwaa ya biashara yanayorahisisha
shughuli za taasisi, kuimarisha utawala, kuboresha maamuzi, na kuharakisha
maendeleo endelevu kupitia uhandisi wa programu wa kiwango cha kimataifa.

The vision is a 20-year direction. The mission is the daily work: every
sprint, every module, every migration is a small installment against this
mission.

---

## Chapter 4 — Core Values

| Value | Meaning |
|---|---|
| **Integrity** | Data and decisions must be trustworthy. |
| **Excellence** | We pursue engineering excellence, not shortcuts. |
| **Innovation** | We embrace continuous improvement and creativity. |
| **Simplicity** | Complexity should be hidden behind elegant design, not exposed to the user or the next engineer. |
| **Security** | Security is designed into every capability, not added later. |
| **Collaboration** | Platforms succeed through teamwork and shared ownership. |
| **Sustainability** | Decisions should remain valuable for the next decade, not just the next release. |

These values are not aspirational decoration — they are meant to inform code
review. A pull request that trades integrity or security for speed fails
against Chapter 4, regardless of whether the tests pass.

---

## Chapter 5 — Engineering Principles

1. **Business capability before implementation.** Understand what the
   business needs before writing the first line of code.
2. **Platform before product.** Build reusable capability, not one-off
   features.
3. **Configuration before customization.** Prefer configuration data over
   hardcoded, per-tenant branching logic.
4. **Documentation evolves together with code.** A change without updated
   documentation is an incomplete change.
5. **Every API is a product.** APIs are designed, versioned, and supported —
   not incidental side effects of an implementation.
6. **Every platform must be extensible.** New capabilities should be
   addable without breaking existing ones.
7. **Security is never optional.** No feature ships with security deferred
   to "a later sprint."
8. **Data integrity is non-negotiable.** Correctness of business data
   outranks convenience of implementation.
9. **Backward compatibility is the default.** Breaking changes require an
   explicit, documented decision — not a side effect of refactoring.
10. **Architecture decisions must outlive frameworks.** Today the platform
    runs on NestJS. Tomorrow it may not. The domain model, the layering, and
    the architectural boundaries must survive that change.

### The One Principle That Is ABMS's DNA

> **ABMS does not chase technology trends; ABMS adopts technologies that
> strengthen long-term architectural integrity.**

*Kwa Kiswahili:* ABMS haikimbilii kila teknolojia mpya; ABMS huchagua
teknolojia zinazodumisha uimara wa architecture kwa muda mrefu.

Every year brings a new framework, a new database, a new AI model, a new
library. Chasing every trend means rewriting the platform every two years.
ABMS instead evaluates new technology strictly against whether it strengthens
the architecture already in place — and rejects it otherwise, no matter how
popular it is.

---

## Chapter 6 — Architecture Principles

ABMS's architecture rests on eight ordered priorities — the platform's "DNA":

1. **Knowledge First.** Understand the domain before building it.
2. **Architecture First.** Design before code.
3. **Platform First.** Build reusable capability, not disposable features.
4. **Business First.** Solve real business problems, not technical
   curiosities.
5. **Data First.** Business data outlives any single implementation; it is
   the platform's most valuable asset.
6. **Security First.** No shortcuts on security, ever.
7. **AI Ready.** Every capability should be structured so AI can eventually
   act on it.
8. **Global by Design.** Build for the world, not for one country.

### The Layering Every Platform Module Follows

```
Platform → Domains → Capabilities → Business Processes → Services → Events → API → UI
```

The UI is the **last** layer, not the first. Business logic exists
independently of whether a user interacts through a web app, a mobile app, a
desktop client, a direct API call, an AI agent, a voice assistant, WhatsApp,
or USSD. This is what allows ABMS to adopt new interaction models without
redesigning core business logic.

**How this already shows up in this codebase:** the Organization module's
`organization-domain` and `organization-application` libraries have zero
framework or channel dependencies (enforced by Nx module boundaries);
`organization-infrastructure` holds the CQRS command/query handlers;
`organization-api` is the *only* library that knows it is speaking REST. Every
future business module (Finance, HR, CRM, Procurement, ...) must follow the
same split, so that a future non-REST channel can dispatch the exact same
commands and queries without touching domain or application code.

### The Enterprise Capability Map

The full space of business domains ABMS is meant to eventually serve:

```
Enterprise
├── Governance
├── Strategy
├── Finance
├── Human Resources
├── Customer
├── Procurement
├── Supply Chain
├── Manufacturing
├── Projects
├── Assets
├── Quality
├── Risk
├── Compliance
├── Sustainability
├── Analytics
├── Artificial Intelligence
└── Industry Platforms
```

This map is the reference for what a fully realized ABMS covers. Each sprint
delivers a small, production-ready piece of it — currently the Organization
domain, under Governance.

### The System Stack

```
                          USERS
                              ▲
                     Industry Solutions
                              ▲
                    Enterprise Platforms
                              ▲
                     Enterprise Engines
                              ▲
                     ABMS Core Kernel
                              ▲
                Enterprise Infrastructure
                              ▲
                    Enterprise Standards
                              ▲
                    Enterprise Knowledge
```

`libs/kernel`, `libs/core/*`, `libs/database`, `libs/tenancy`, and `libs/cqrs`
built in Sprint 1 are the **Enterprise Infrastructure** and **ABMS Core
Kernel** layers of this stack. Business modules like Organization are the
first **Enterprise Engines**.

---

## Chapter 7 — Product Principles

1. **Every API is a product.** It is designed for a consumer who is not in
   the room, documented, versioned, and never broken silently.
2. **Every capability must be channel-agnostic.** A capability built for the
   REST API must be equally usable from a future AI agent, a WhatsApp bot, or
   a USSD menu, without rewriting business logic.
3. **The platform grows through an ecosystem, not a monolith.** Long-term,
   ABMS is expected to grow surfaces beyond the core platform: ABMS Cloud,
   ABMS Identity, ABMS Marketplace, ABMS Payments, ABMS AI, ABMS Analytics,
   ABMS Developer Portal, ABMS API Gateway, ABMS Documentation, ABMS Learning,
   and ABMS Community. None of these exist yet — but no architectural
   decision made today should foreclose them.
4. **Multi-tenancy is a core architectural capability**, not a feature toggle.
   Every tenant-scoped table in this platform is protected at the database
   level (PostgreSQL Row-Level Security), not merely filtered in application
   code.
5. **Configuration is a product surface.** Where SAP/Dynamics/NetSuite expose
   configuration as a first-class capability for implementation partners, so
   must ABMS — this is why the Organization module's `OrgUnitType` hierarchy
   is metadata-driven rather than a hardcoded enum.

---

## Chapter 8 — Governance Principles

Enterprise products like SAP, Microsoft, Salesforce, and Oracle did not grow
large because their software was large — they grew because they built an
**ecosystem of people** who knew how to implement and extend the platform.
ABMS intends to follow the same path through a future **ABMS Engineering
Institute**: research, architecture stewardship, certification, training, a
developer academy, and a partner academy (Solution Architect Certification,
Developer Certification, Implementation Partner Certification). This is
aspirational infrastructure for a later stage — noted here so today's
architecture does not close the door on it.

### The Five Governance Stages

| Stage | Focus |
|---|---|
| **1. Foundation Governance** | Vision & mission, engineering manifesto, enterprise principles, governance model, decision-making process — this Constitution. |
| **2. Architecture Governance** | Enterprise Architecture Blueprint, ADR repository, RFC process, domain map, capability map. |
| **3. Engineering Governance** | Engineering design standards, repository standards, branching strategy, release strategy, testing strategy, documentation standards. |
| **4. Platform Foundation** | Configuration, logging, audit, identity, organization, and workflow platforms — the reusable cross-cutting capability every business platform depends on. |
| **5. Enterprise Platforms** | Finance, HR, CRM, Procurement, Inventory, Reporting, AI — the business capability that end users actually touch. |

As of this Constitution's writing, ABMS has completed Stage 1 (this document)
and made a start on Stage 2 (this document plus the ADR process introduced in
`docs/adr/`). Stage 4's Platform Foundation is where Sprint 1 (Configuration,
Database/Multi-tenancy, CQRS infrastructure) and the Organization module sit.

---

## Chapter 9 — Decision Framework

Not every decision carries the same weight. ABMS distinguishes three tiers:

1. **Implementation details** — resolved by whoever is doing the work,
   consistent with this Constitution and the existing codebase's conventions.
   No process required.
2. **Significant architecture decisions** — anything that would be expensive
   to reverse (a data model shape, a multi-tenancy strategy, a monorepo
   tooling choice, a cross-module contract). These **must** be recorded as an
   Architecture Decision Record (ADR) in `docs/adr/`, following the template
   there. An ADR records the context, the decision, the alternatives
   considered, and the consequences — so a future engineer can understand
   *why*, not just *what*.
3. **Platform-shaping decisions** — anything that changes the Enterprise
   Capability Map, the layering in Chapter 6, or a Core Value — these require
   an explicit conversation with the project owner before implementation
   begins, the same way Sprint 1's multi-tenancy strategy and Sprint 2's
   organization-hierarchy storage strategy were each confirmed before code
   was written.

When a decision is genuinely uncertain, the default is to **ask**, not to
guess — matching this project's existing engineering guidance that no change
should happen after "kubahatisha" (guessing) imports, dependencies, or
architecture.

A future **RFC process** (Request for Comments) is anticipated for
platform-shaping decisions once the contributor base grows beyond a single
maintainer — proposals written up, reviewed, and either accepted into an ADR
or rejected with recorded reasoning. Not yet needed at current scale, but the
ADR discipline started now is the foundation that process will sit on.

---

## Chapter 10 — The Future

This Constitution describes a platform still early in its life — Sprint 1
(Foundation) and Sprint 2 (Organization Module) are complete as of this
writing. The distance between here and the vision in Chapter 2 is large by
design. What follows is the map, not a commitment to a timeline.

**Near-term (Phase 2–3 of the existing roadmap):** Company Management, Branch
Management, Department Management, Cost Centers, Profit Centers, then Finance,
Procurement, Inventory, CRM, HR, Payroll, Assets — filling out the Enterprise
Capability Map one production-ready module at a time.

**Mid-term (Phase 4):** FinTech capability, an Investor Portal, Business
Incubation and Startup Funding tooling, Loan Management, an AI platform,
Compliance Automation, tax-authority integrations, and an Analytics platform
— the point where ABMS starts to look less like an ERP and more like the
"ABOS" described in Chapter 1.

**Long-term:** the ecosystem surfaces named in Chapter 7 — ABMS Cloud,
Identity, Marketplace, Payments, AI, Analytics, Developer Portal, API
Gateway, Documentation, Learning, and Community — plus the governance
infrastructure in Chapter 8, the Engineering Institute, and eventually a
canonical reference body of platform knowledge (referred to informally as
"The Book of ABMS": Vision, Architecture, Engineering, Platform Design,
Business Domains, Industry Solutions, Cloud, AI, Operations, and Future
Research as its ten volumes).

None of this is built yet. All of it is why the discipline in Chapters 5
through 9 exists: a platform this ambitious is only reachable if every sprint
between now and 2035 is built on a foundation that does not need to be torn
down later.

---

*This Constitution is versioned. Amendments should be proposed the same way a
platform-shaping decision is proposed under Chapter 9, and recorded as a new
version with a changelog, not silently edited.*
