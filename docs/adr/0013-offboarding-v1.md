# ADR-0013: Offboarding v1 — Exit Cases, Checklist Tasks, Employee Termination

**Status:** Accepted

**Date:** 2026-07-19

## Context

Continuing the HR & Workforce Suite build-out after Core HR, Leave &
Attendance, Payroll, Recruitment & Onboarding, and Performance Management
(ADR-0008 through ADR-0012), Offboarding is the natural lifecycle bookend to
Recruitment: where Recruitment ends in *creating* an Employee, Offboarding
ends in *terminating* one. v1 scopes this to a single `OffboardingCase` per
exit (tracking exit reason and last working day, `INITIATED` →
`COMPLETED`/`CANCELLED`) with a default checklist of `OffboardingTask` rows
seeded on initiation, mirroring Recruitment's `OnboardingTask` pattern
exactly. Explicitly **not** in v1: exit surveys/sentiment capture, knowledge-
transfer workflows, a configurable per-tenant checklist template, rehire-
eligibility flags, or any approval chain before a case can be initiated —
each is a distinct future scoping pass.

## Decision

### 1. Completing a case directly terminates the Employee aggregate, in the same transaction — the offboarding mirror of ADR-0011's central decision

`CompleteOffboardingHandler` does not dispatch a command through the command
bus to terminate the employee. It loads the `Employee` via
`TypeOrmEmployeeRepository` (from `@abms/hr-infrastructure`) against the
**same** `EntityManager` the rest of the handler runs against, calls
`employee.terminate(offboardingCase.lastWorkingDay)`, and persists both the
`Employee` and the `OffboardingCase` before the transaction commits. This is
the exact same reasoning as `HireCandidateHandler` (ADR-0011, point 1):
`TenantAwareUnitOfWork.withTransaction()` always opens a **new** database
connection per call, so dispatching a second command from inside an
already-transactional handler would silently split "the case is COMPLETED"
and "the employee is TERMINATED" across two independent transactions — a
real atomicity bug. `libs/hr/offboarding/infrastructure` therefore takes the
same deliberate, narrow dependency on `@abms/hr-infrastructure` that
Recruitment's infrastructure layer does, for the same reason.

### 2. Only one `INITIATED` (in-flight) case per employee, enforced at both the handler and the database level

`InitiateOffboardingHandler` calls
`IOffboardingCaseRepository.findActiveByEmployee(tenantId, employeeId)` and
rejects with `BusinessRuleViolationException` if an `INITIATED` case already
exists — the same defense-in-depth posture as Performance Management's
duplicate-review guard (ADR-0012, point 3). The database backs this with a
**partial** unique index (`WHERE status = 'INITIATED'`) on
`(tenant_id, employee_id)`, matching `SalaryStructure`'s "one active row"
partial-unique-index pattern (ADR-0010) — `COMPLETED`/`CANCELLED` cases stay
as history and do not block a later, genuinely new exit case for the same
employee (e.g. a rehire who leaves again).

### 3. `InitiateOffboardingHandler` also rejects an already-terminated employee

Before creating a case, the handler checks `employee.status !== 'TERMINATED'`
and throws if it is — offboarding an employee who has already left is not a
meaningful operation, and this catches a caller error earlier and with a
clearer message than letting `Employee.terminate()`'s own
`assertNotTerminated` guard fire deeper in `CompleteOffboardingHandler`
later.

### 4. Default checklist is a hardcoded list, not a per-tenant configurable template — same deferral as Onboarding

`InitiateOffboardingHandler` seeds four fixed `OffboardingTask` rows ("Return
company equipment", "Revoke system and building access", "Conduct exit
interview", "Final payroll and benefits settlement") on every case. This is
the direct mirror of Recruitment's `DEFAULT_ONBOARDING_TASKS` deferral
(ADR-0011, point 4) — v1 proves the checklist data model and completion
workflow; per-tenant/per-department template configuration is a distinct,
separately-scoped feature.

### 5. `OffboardingTask` emits no domain events — same reasoning as `OnboardingTask`

Nothing currently subscribes to an individual offboarding task's completion.
Matching `OnboardingTask`'s reasoning (ADR-0011, point 5), adding an event
now with no consumer would be unused surface area. `OffboardingCase`, by
contrast, does emit events on `initiate()`/`complete()`/`cancel()` — these
are the business-meaningful milestones an external system (e.g. IT
provisioning, a future notification service) would plausibly want to react
to, consistent with the "only meaningful milestones get events" judgment
call applied throughout this suite (ADR-0011 point 3, ADR-0012 point 5).

### 6. Completing a task does not gate completing the case

`CompleteOffboardingCommand` does not check whether all `OffboardingTask`
rows for the case are complete before allowing `OffboardingCase.complete()`
to run. The checklist is informational/operational tracking, not a
blocking approval gate in v1 — an HR admin can complete the case (and
therefore terminate the employee) regardless of checklist state. This
matches the same scope discipline as v1's lack of an approval chain (see
Consequences); revisit if a future requirement demands "cannot terminate
until IT equipment is returned"-style hard gates.

## Alternatives Considered

- **Dispatch a `TerminateEmployeeCommand` via the command bus from
  `CompleteOffboardingHandler`.** Rejected outright per point 1 — breaks
  transactional atomicity between the case and employee state changes, a
  correctness bug, not a style preference, for the same reason ADR-0011
  rejected the equivalent approach for hiring.
- **Allow multiple concurrent `INITIATED` cases per employee.** Rejected per
  point 2 — a departing employee has exactly one active exit process at a
  time in any real organization; modeling otherwise adds no value and
  invites duplicate-tracking confusion.
- **Gate `CompleteOffboardingCommand` on all `OffboardingTask` rows being
  complete.** Rejected for v1 per point 6 — no evidence yet of which
  checklist items should be hard blockers versus advisory; a blanket gate
  now would be a guess, not a grounded requirement.
- **Let each tenant configure their offboarding checklist template now.**
  Rejected per point 4, mirroring ADR-0011's identical deferral for
  onboarding.

## Consequences

**Easier:** Offboarding now has a real, working v1 end-to-end (initiate a
case → checklist auto-seeded → complete tasks → complete the case →
Employee correctly transitions to `TERMINATED` with the right termination
date), verified via integration test (asserting the cross-aggregate
transaction lands both the case and the employee correctly, plus RLS
policies on both tables) and a live HTTP smoke test covering the full flow
plus three rejection paths — offboarding an already-terminated employee,
completing an already-completed case, and starting a second concurrent case
for the same employee — all correctly returning 422 and recorded as
FAILURE rows in `audit_log`, alongside every successful command's audit
attribution.

**Harder / explicit follow-up work:**

- `OffboardingHandler`'s direct dependency on `hr-infrastructure` (point 1)
  is a deliberate, narrow exception to the opaque-FK-only pattern, not a
  precedent for cross-sub-module coupling without the same atomicity
  justification — identical posture to ADR-0011.
- No exit survey/sentiment capture, knowledge-transfer workflow, or
  rehire-eligibility flag — `OffboardingCase` tracks only reason and last
  working day.
- Checklist is a fixed, hardcoded list (point 4) — no per-tenant
  customization yet.
- No task-completion gate on case completion (point 6) — the checklist is
  advisory, not enforced, in v1.
- No approval chain before a case can be initiated or completed — any
  authenticated user with API access can trigger a termination; this is the
  same open RBAC gap already flagged in ADR-0006 through ADR-0012 for every
  other Foundation/HR module.
