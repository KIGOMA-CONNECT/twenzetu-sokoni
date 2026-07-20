# ADR-0017: Compliance & Reporting v1 — Requirement Catalog, Employee Records

**Status:** Accepted

**Date:** 2026-07-20

## Context

This is the final module of the HR & Workforce Suite v1, following Core HR,
Leave & Attendance, Payroll, Recruitment & Onboarding, Performance
Management, Offboarding, Compensation & Benefits, Learning & Development,
and Succession & Talent Management (ADR-0008 through ADR-0016). v1 covers a
tenant-defined catalog of compliance requirements (e.g. "Annual Fire Safety
Certification") and per-employee records tracking status against each one.
Explicitly **not** in v1: automated overdue detection (no scheduler exists
in this codebase yet), a link to Learning & Development's course
completions (flagged as a deferred join in ADR-0015's Consequences),
tenant-wide compliance dashboards/reporting views beyond the two list
queries this sprint ships, or recurrence-driven auto-generation of the next
assignment cycle.

## Decision

### 1. `ComplianceRequirement`/`EmployeeComplianceRecord` are opaque-FK, self-contained within `scope:hr` — same posture as Leave & Attendance/Payroll/Succession

`EmployeeComplianceRecord.employeeId` is a plain `EntityId` with no
TypeScript dependency on `@abms/hr-domain` or `@abms/hr-infrastructure` —
the migration declares a raw-SQL foreign key to `employee` for referential
integrity, but no handler in this sprint needs to load or mutate the
`Employee` aggregate in the same transaction. Applying the same decision
framework from ADR-0016: no handler here needs to mutate another module's
aggregate state, so this stays in the narrower, self-contained camp
(Leave & Attendance ADR-0009, Payroll ADR-0010, Succession ADR-0016) rather
than the cross-module direct-mutation exception (Recruitment ADR-0011,
Offboarding ADR-0013, Compensation & Benefits ADR-0014).

### 2. `ComplianceRequirement` mirrors `Course`'s catalog-entry shape exactly

`create()`/`deactivate()` only, no further lifecycle — structurally
identical to `Course` (`@abms/hr-learning-domain`, ADR-0015) and
`BenefitPlan` (`@abms/hr-compensation-domain`, ADR-0014). A deactivated
requirement can no longer be assigned to new employees
(`assertActive('assign to an employee')`), matching `Course.assertActive()`.

### 3. `EmployeeComplianceRecord` has a 3-way terminal outcome instead of complete/cancel

Unlike `CourseEnrollment` (`IN_PROGRESS` → `COMPLETED`/`CANCELLED`),
`EmployeeComplianceRecord` starts `PENDING` and transitions to one of three
terminal states: `COMPLIANT` (the employee satisfied the requirement),
`OVERDUE` (the due date passed unmet), or `EXEMPT` (the requirement doesn't
apply to this employee, with a required reason). Reporting on compliance
posture needs to distinguish "did it," "missed it," and "doesn't apply" as
three genuinely different facts, not two — a plain complete/cancel binary
would collapse "missed the deadline" and "was excused" into the same
bucket, which defeats the module's whole purpose (its name is Compliance
**and Reporting**). Once terminal, a record is not reopened in v1; a new
assignment cycle is a fresh `assign()` call, not a status reset.

### 4. Overdue transition is an explicit command, not an automated scheduler job

`MarkComplianceRecordOverdueCommand` exists as a manually-invoked command
because no scheduled-job infrastructure exists anywhere in this codebase
yet — silently pretending a record becomes `OVERDUE` on its own would be
inaccurate. This mirrors the codebase's established pattern of explicit,
written scope deferrals rather than silent gaps (e.g. ADR-0005's deferred
rate limiting): a future scheduler sprint can call this same command once
one exists, rather than this module inventing ad hoc cron/polling logic
that would need to be redone anyway.

### 5. One `PENDING` record per employee per requirement, enforced by the handler + a partial unique index

`AssignComplianceRequirementHandler` checks
`IEmployeeComplianceRecordRepository.findPendingByEmployeeAndRequirement()`
and rejects with `BusinessRuleViolationException` if one already exists,
backed by a partial unique index (`WHERE status = 'PENDING'`) on
`(tenant_id, employee_id, compliance_requirement_id)` — the same
defense-in-depth posture as `CourseEnrollment` (ADR-0015) and
`SuccessionPlan`/`SuccessionCandidate` (ADR-0016). A terminal record
doesn't block a later, genuinely new assignment cycle for the same
employee/requirement pair.

### 6. No join to Learning & Development's course completions yet

ADR-0015 explicitly flagged this as deferred: "course completions that
should satisfy a compliance requirement must be tracked manually until
that join is designed." This sprint doesn't design that join either —
doing so now, before either module's read patterns have matured, would be
guessing at a shape neither side has validated. `EmployeeComplianceRecord`
and `CourseEnrollment` remain two independent aggregates in two independent
libs; an operator satisfies a compliance requirement by directly calling
`MarkComplianceRecordCompliantCommand`, whether or not the underlying
evidence was a `Course` completion.

## Alternatives Considered

- **Give `EmployeeComplianceRecord` the same cross-module Employee-mutation
  treatment as Recruitment/Offboarding/Compensation.** Rejected per point 1
  — nothing in this sprint's scope requires mutating `Employee` state.
- **Model the record status as a simple complete/cancel binary, matching
  `CourseEnrollment` exactly.** Rejected per point 3 — compliance reporting
  needs the three-way distinction between met, missed, and exempted; a
  binary would lose information the module exists to capture.
- **Auto-transition records to `OVERDUE` via a computed/virtual status at
  query time instead of a stored, explicitly-set value.** Rejected — a
  computed status would silently diverge from the stored value the moment
  any read path forgot to apply the computation, and would need "now" as an
  implicit query-time input that complicates caching/read-model
  consistency. An explicit command keeps the stored status as the single
  source of truth, at the cost of needing a caller (human or, later, a
  scheduler) to invoke it.
- **Design the Learning & Development join now.** Rejected per point 6 —
  premature; revisit once both modules' consumers are known.

## Consequences

**Easier:** The HR & Workforce Suite v1 is now fully closed out —
Compliance & Reporting has a real, working v1 end-to-end (create a
requirement → assign it to an employee → confirm a duplicate assignment is
rejected → mark it compliant → confirm a second transition is rejected →
deactivate the requirement → confirm assigning it to another employee is
rejected), verified via integration test (asserting the compliant
transition persists correctly, plus RLS policies on both tables) and a live
HTTP smoke test covering the full flow plus all three rejection paths,
correctly returning 422 and recorded as FAILURE rows in `audit_log`,
alongside every successful command's audit attribution.

**Harder / explicit follow-up work:**

- No scheduled job exists to automatically transition `PENDING` records
  past their `dueDate` into `OVERDUE` — this requires a caller (human or,
  later, a scheduler) to invoke `MarkComplianceRecordOverdueCommand`
  explicitly.
- No link to Learning & Development — a `Course` completion doesn't
  automatically satisfy a `ComplianceRequirement`; both must be tracked and
  marked separately until that join is designed.
- No recurrence-driven auto-generation of the next assignment cycle —
  `recurrence` is descriptive metadata only in v1; a new `PENDING` record
  for the next period must be created via a fresh `assign()` call.
- No tenant-wide compliance dashboard beyond the two list queries this
  sprint ships (`ListComplianceRequirementsQuery`,
  `ListComplianceRecordsForEmployeeQuery`,
  `ListComplianceRecordsForRequirementQuery`) — aggregate reporting (e.g.
  "% compliant across the whole tenant") is a future Business Suite concern
  once the Foundation Layer + 22 Business Suites taxonomy's reporting
  capability is scoped.
- No role-based restriction on any `/hr/compliance/*` route yet — matches
  the same open RBAC gap already flagged in ADR-0006 through ADR-0016 for
  every other Foundation/HR module.
