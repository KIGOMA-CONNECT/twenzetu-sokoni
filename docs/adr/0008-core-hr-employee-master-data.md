# ADR-0008: Core HR — Employee Master Data, Positions, Employment History, Documents

**Status:** Accepted

**Date:** 2026-07-14

## Context

The user directed that HRM be built "fully functional as per international
standards and not otherwise" — a scope far larger than a single sprint (a
complete HRIS/HCM covers Core HR, Recruitment & Onboarding, Time &
Attendance, Leave, Performance Management, Compensation & Benefits, Payroll,
Learning & Development, Succession/Talent Management, Offboarding, and
Compliance & Reporting). Given user confirmation, the build proceeds
incrementally module-by-module rather than attempting all of it at once —
matching the Constitution's own "each sprint fills in one production-ready
piece" philosophy — starting with **Core HR**, since every other HR module
(Leave, Attendance, Performance, Payroll, Recruitment) references an
Employee record that must exist first.

Core HR itself was scoped, per the domain-notes precedent
(`abos-domain-modules` memory: "Full HR & Performance Management... needs its
own scoping pass") to: employee master data, a position/job-title catalog,
organizational assignment, employment history, and document metadata —
explicitly **not** goal-setting, performance reviews, payroll, or merit
rewards, which remain distinct future modules.

## Decision

### 1. Four aggregates/records, not one: `Position`, `Employee`, `EmploymentHistoryEntry`, `EmployeeDocument`

`Position` is a small catalog aggregate (mirrors `OrgUnitType`'s shape
exactly: `code`/`title`/`description`/`isActive`). `Employee` is the core
aggregate: personal details, employment details (`employmentType`,
`hireDate`, `positionId`, `orgUnitId`), and a lifecycle state machine
(`ACTIVE` → `SUSPENDED` ⇄ `ACTIVE`, or `ACTIVE`/`SUSPENDED` → `TERMINATED`,
a one-way terminal transition — matching real HR semantics where a
terminated record is never "un-terminated"; a rehire would be a new
Employee record). `EmploymentHistoryEntry` is a plain immutable record (not
an `AggregateRoot` — it has no mutators and emits no events of its own; it
*is* the durable record of an Employee's own emitted events).
`EmployeeDocument` stores upload *metadata* only (`fileUrl` points at
wherever the caller already uploaded the file) — building an actual
file-storage pipeline is the separate, not-yet-built Document Management
Foundation capability (Constitution Ch. 6); this deliberately does not
duplicate that.

### 2. `employment_history` combines RLS *and* WORM — unlike `audit_log`

`audit_log` (ADR-0006) had to skip RLS because some audited actions (a
failed login, tenant registration) happen before any tenant context exists.
Every `employment_history` row, by contrast, is written from inside an
already-tenant-scoped `Employee` mutation (`TenantAwareUnitOfWork` always
has a tenant GUC set by the time any HR handler runs), so RLS tenant
isolation and WORM immutability are both safe and both applied: the
migration calls `enableRowLevelSecurity()` **and** issues the same
`REVOKE UPDATE, DELETE ON "employment_history" FROM "abms_runtime"` pattern
as `audit_log`. These are independent, orthogonal properties — RLS governs
row *visibility* per role, the REVOKE removes the mutation grant entirely,
for anyone — so combining them is not a contradiction, just two separate
guarantees stacked on the same table.

### 3. History entries are written synchronously in the same transaction as the state change, not via a published-event subscriber

Every mutating Employee command handler (`SuspendEmployeeHandler`,
`TerminateEmployeeHandler`, etc.) explicitly calls
`historyRepository.append(EmploymentHistoryEntry.create({...}))` right after
saving the aggregate — inside the same DB transaction. This was a deliberate
choice over having a separate subscriber react to the aggregate's published
domain events (`EmployeeSuspendedEvent` etc., which are also genuinely
published via `ctx.addEvent()` — see point 4): a WORM audit trail of
employment changes must never be eventually-consistent with the state it
describes. If the transaction commits, the history row exists; there is no
window where an Employee shows `TERMINATED` but the history table hasn't
caught up yet.

### 4. Domain events are correctly wired end-to-end — continuing the pattern established in ADR-0007, not the pre-existing Organization gap

Every HR command handler calls
`for (const event of aggregate.domainEvents) ctx.addEvent(event);` before
returning, so `EmployeeHiredEvent`, `EmployeeSuspendedEvent`,
`EmployeeTerminatedEvent`, etc. genuinely reach the event bus — consistent
with the fix already made for Workflow in ADR-0007. (Organization's own
handlers still don't do this; that gap remains open and out of scope here.)

### 5. `userId`/`orgUnitId`/`positionId` cross-references, and the `scope:hr` Nx tier

`Employee.userId` (linking to identity's `User`) and `Employee.orgUnitId`
(linking to organization's `OrgUnit`) are plain opaque strings with no
compile-time type coupling and no DB foreign key — the same deferred-
integrity precedent `OrgUnit.parentId` already established in ADR-0004.
`Employee.positionId`, by contrast, *does* get a real FK (`ON DELETE
RESTRICT`) to `position.id`, since `Position` lives inside the same `libs/hr`
bounded context and there's no cross-module dependency-direction concern.

`libs/hr` is a new Nx `scope:hr` bounded-context tier (peer to
`scope:organization`/`scope:identity`, not a foundation-tier lib like
`scope:workflow`) — it depends on the full foundation chain
(kernel/core/tenancy/database/audit/cqrs/workflow) but not on
`scope:organization` or `scope:identity` directly, matching point 5's opaque-
reference design. Future HR sub-modules (Payroll, Leave, Performance,
Recruitment) are expected to grow as new libs *within* `scope:hr` (e.g.
`libs/hr/payroll`), referencing `Employee` directly, rather than becoming
separate bounded contexts of their own.

## Alternatives Considered

- **Build the full 11-module HRM suite in one sprint.** Rejected outright —
  not achievable at production quality in a single pass, and the
  Constitution's own incremental-delivery discipline exists precisely to
  avoid this. Confirmed with the user: Core HR first (unavoidable
  prerequisite), then Leave/Attendance/Performance, Payroll, and
  Recruitment/Onboarding all as equally-near-term priorities (not deferred
  to last), sequenced by technical dependency as each is built.
- **A `workflow_definition_step`-style child table for `EmploymentHistoryEntry`
  instead of a flat table with a `details: text` field.** Rejected: unlike
  a workflow's ordered step list, employment history entries aren't a
  structured sub-object of a single parent row — they're independent,
  individually-queryable timeline events. A flat table with its own primary
  key (already the natural shape) needs no such reconsideration.
- **Route `EmploymentHistoryEntry` writes through the published domain events
  (an async subscriber) instead of a synchronous same-transaction append.**
  Rejected per point 3 — WORM history must be atomic with the state change,
  not eventually consistent.
- **Give `Employee.status` an `ON_LEAVE` state now**, anticipating the future
  Leave module. Rejected: nothing in this sprint sets or reads that state,
  and an unreachable enum value is worse than adding it when the Leave
  module actually needs it — a one-line addition later, not a migration
  headache.

## Consequences

**Easier:** every future HR sub-module (Leave, Attendance, Performance,
Payroll, Recruitment) has a real `Employee` record to attach to from day
one, with a genuine employment-history timeline already flowing correctly.
Domain events are already published for HR, so a future Notification Engine
integration ("notify HR when an employee is terminated") needs no additional
plumbing.

**Harder / explicit follow-up work:**

- No role-based restriction on any `/hr/*` route yet — mirrors the same open
  gap flagged in ADR-0006/ADR-0007 for Organization/Workflow; all three
  should likely be resolved together once a per-route role policy is
  decided.
- No actual file-upload/storage pipeline — `EmployeeDocument.fileUrl` trusts
  whatever URL the caller supplies. Building real object-storage upload is
  the separate Document Management Foundation capability, not duplicated
  here.
- No optimistic-lock (`expectedVersion`) check on Employee mutations —
  matches the same posture already accepted for Workflow (ADR-0007) and
  several existing Organization mutators.
- `Employee.status` has no `ON_LEAVE` value yet; the future Leave module will
  need to add it and decide how leave interacts with `SUSPENDED`.
