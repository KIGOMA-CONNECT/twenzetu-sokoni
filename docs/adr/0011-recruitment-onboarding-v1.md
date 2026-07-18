# ADR-0011: Recruitment & Onboarding v1 — Job Requisitions, Candidates, Applications, Onboarding Tasks

**Status:** Accepted

**Date:** 2026-07-18

## Context

Per the "combine 1-3" sequencing (ADR-0008/0009/0010), Recruitment &
Onboarding is the last of the three equally-near-term HR sub-modules after
Core HR, Leave & Attendance, and Payroll. Per the domain memory
(`abms-enterprise-suites-architecture`), the HR & Workforce Suite's full
shape includes "recruitment, employee master, onboarding" among its modules.
v1 scopes this to a lightweight ATS (applicant tracking system) pipeline:
job requisitions against an existing `Position` (Core HR, ADR-0008), a
candidate registry, a single-track application pipeline (APPLIED →
SCREENING → INTERVIEWING → OFFERED → HIRED/REJECTED/WITHDRAWN), and a
default onboarding checklist seeded the moment a candidate is hired.
Explicitly **not** in v1: multiple interviewers/interview scheduling,
structured scorecards, offer-letter generation/e-signature, background-check
integration, or a configurable (per-tenant) onboarding checklist template —
each is a distinct future scoping pass.

## Decision

### 1. `HireCandidateHandler` constructs the `Employee` aggregate directly, in the same transaction — not by dispatching Core HR's `CreateEmployeeCommand` over the command bus

This is the one deliberate exception to the opaque-FK-only pattern every
other HR sub-module has followed (Leave & Attendance, Payroll — both
reference `employeeId`/`positionId` as plain `EntityId` values with no
TypeScript dependency on `hr-domain`/`hr-infrastructure`). Recruitment's
entire purpose is to *produce* an Employee, and that production must be
atomic with "the Application is now HIRED" — if the transaction rolls back
for any reason, neither should have happened.

`TenantAwareUnitOfWork.withTransaction()` always opens a **new** `QueryRunner`
(a fresh connection) on every call (`libs/database/src/lib/unit-of-work/tenant-aware-unit-of-work.ts`).
`@nestjs/cqrs`'s `CommandBus.execute()` invokes the target handler
synchronously in the same call stack, so calling
`this.commandBus.execute(new CreateEmployeeCommand(...))` from inside
`HireCandidateHandler.handle()` would silently open a **second, independent**
transaction for the Employee row — completely decoupled from the outer
transaction's commit/rollback. A failure after the Employee insert but
before the outer transaction commits (e.g. the onboarding-task inserts
throwing) would leave a committed `employee` row with no corresponding
`APPLIED`→`HIRED` transition, or vice versa — a real partial-failure/
atomicity bug, not a hypothetical one.

The fix: `libs/hr/recruitment/infrastructure` takes a direct dependency on
`@abms/hr-domain` (for `Employee.create()`/`EmploymentHistoryEntry.create()`)
and `@abms/hr-infrastructure` (for `TypeOrmEmployeeRepository`/
`TypeOrmEmploymentHistoryRepository`), and `HireCandidateHandler` uses them
against the **same** `EntityManager` (`ctx.manager`) that the rest of the
handler's work runs in — the same pattern already used for calling multiple
repositories within one module's own handler, just crossing a module
boundary deliberately. The uniqueness checks (`employeeNumber`/email) and
the `EmploymentHistoryEntry.create({eventType: 'HIRED', ...})` call
duplicate what `CreateEmployeeHandler` in `hr-infrastructure` does — this is
accepted duplication in exchange for correctness, not an oversight.

### 2. Job requisitions, not "open positions" — `Position` (catalog) and `JobRequisition` (hiring demand) stay separate

A `Position` (Core HR) is a reusable job-title catalog entry ("Software
Engineer" exists once). A `JobRequisition` is a specific hiring need against
that position, with its own `headcount` and lifecycle (`OPEN`/`CLOSED` with
a `closeReason` of `FILLED` or `CANCELLED`). Multiple requisitions can exist
for the same Position over time (e.g. two separate hiring rounds), and a
Position can exist with zero open requisitions.

### 3. `Application`'s stage pipeline only emits domain events at business-meaningful milestones, not every intermediate transition

`Application.submit()`/`hire()`/`reject()`/`withdraw()` each emit a domain
event; `advanceToScreening()`/`advanceToInterviewing()`/`makeOffer()` do
not. All are still fully **audited** (every command handler extends
`TransactionalCommandHandler`, which logs a SUCCESS/FAILURE row per command
regardless of whether the aggregate emitted a domain event — see ADR-0006),
so command-level accountability is unaffected. This mirrors the same
"only meaningful milestones get events" judgment call already made for
`SalaryStructure`/`OnboardingTask` (ADR-0010, this ADR) — nothing currently
subscribes to a stage-advance event, and adding one speculatively would be
scope creep.

### 4. Default onboarding tasks are a hardcoded list, not a per-tenant configurable template

`HireCandidateHandler` seeds four fixed `OnboardingTask` rows ("Collect
signed employment contract", "IT equipment and account setup", "HR
orientation session", "Introduce to manager and team") on every hire. A
real HRIS would let each tenant define its own onboarding checklist
template (possibly per-department or per-position). Deferred — v1 proves
the onboarding-task data model and completion workflow; the
template-configuration UI/data model is a distinct, separately-scoped
feature.

### 5. `OnboardingTask` emits no domain events, even on `complete()`

Unlike `Application`, no other module currently needs to react to an
individual onboarding task's completion — no "notify HR when onboarding is
100% done" feature exists yet (that would require a completion-percentage
concept on some future `OnboardingChecklist` aggregate, not built here per
point 4's "keep it a flat task list" decision). Adding an event now with no
subscriber would be unused surface area.

## Alternatives Considered

- **Dispatch `CreateEmployeeCommand` via the command bus from
  `HireCandidateHandler`.** Rejected outright per point 1 — breaks
  transactional atomicity between the Application and Employee state
  changes, a correctness bug, not a style preference.
- **Merge `JobRequisition` into `Position` (add an `openHeadcount` field to
  Position itself).** Rejected per point 2 — collapses reusable catalog data
  with a specific hiring event's lifecycle, and would make "two concurrent
  hiring rounds for the same title" unrepresentable.
- **Emit a domain event for every `Application` stage transition
  (screening/interviewing/offered), matching `LeaveRequest`'s per-transition
  event style (ADR-0009).** Rejected per point 3 for this specific
  aggregate — `LeaveRequest`'s events are meaningfully different states an
  external system might care about (approved changes a balance);
  `Application`'s intermediate stages don't yet have any such consumer.
  Revisit if a future integration needs them.
- **Let each tenant configure their onboarding checklist template now.**
  Rejected for v1 per point 4 — no evidence yet of what configuration
  granularity tenants actually want; a hardcoded default proves the
  mechanism without prematurely committing to a schema for "template".

## Consequences

**Easier:** Recruitment & Onboarding now has a real, working v1 end-to-end
(open requisition → register candidate → submit application → advance
through the pipeline → hire), verified via integration test (asserting the
Employee row, employment history entry, and onboarding tasks all land
correctly within one atomic transaction) and a live HTTP smoke test
covering the full flow plus the closed-requisition rejection path (422,
correctly recorded as a FAILURE in `audit_log`) and every command's audit
attribution.

**Harder / explicit follow-up work:**

- `HireCandidateHandler`'s direct dependency on `hr-domain`/`hr-infrastructure`
  (point 1) means Recruitment is no longer purely "opaque-FK isolated" from
  Core HR — a deliberate, narrow exception, not a precedent for other
  cross-sub-module coupling without the same atomicity justification.
- No interview scheduling, scorecards, or multi-interviewer support —
  `advanceToInterviewing()`/`makeOffer()` are single decision points with no
  supporting data beyond the status change itself.
- No offer-letter generation or e-signature integration — `makeOffer()`
  is a bare status transition.
- Onboarding checklist is a fixed, hardcoded list (point 4) — no per-tenant
  customization yet.
- No role-based restriction on any `/hr/recruitment/*` route yet — matches
  the same open gap already flagged in ADR-0006/0007/0008/0009/0010 for the
  other Foundation/HR modules.
