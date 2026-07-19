# ADR-0014: Compensation & Benefits v1 — Salary Revisions, Benefit Plans, Enrollments

**Status:** Accepted

**Date:** 2026-07-19

## Context

Continuing the HR & Workforce Suite build-out after Core HR, Leave &
Attendance, Payroll, Recruitment & Onboarding, Performance Management, and
Offboarding (ADR-0008 through ADR-0013), Compensation & Benefits is next per
the domain memory (`abos-domain-modules`), which explicitly names "merit-
based rewards ... salary increments" as part of the full HR/Payroll scope.
v1 covers two capabilities: recording a salary revision (raise, promotion,
market adjustment) that changes an employee's live compensation, and a
tenant-defined benefit plan catalog with employee enrollment. Explicitly
**not** in v1: multi-step approval workflows for raises, retroactive pay
calculations, benefit cost deduction from payslips (Payroll's `Payslip`
aggregate is untouched by this sprint), or configurable per-plan enrollment
eligibility rules — each is a distinct future scoping pass.

## Decision

### 1. `RecordSalaryRevisionHandler` directly mutates the active `SalaryStructure` (`@abms/hr-payroll-domain`) in the same transaction — the compensation mirror of ADR-0011/ADR-0013's central decision

`SalaryStructure` (Payroll, ADR-0010) already exposes `updateBasicSalary()`.
Rather than dispatching a command through the command bus to Payroll,
`RecordSalaryRevisionHandler` loads the employee's active `SalaryStructure`
via `TypeOrmSalaryStructureRepository` (from `@abms/hr-payroll-infrastructure`)
against the **same** `EntityManager` the rest of the handler runs against,
calls `updateBasicSalary(newBasicSalary)`, persists it, and only then
constructs and appends the `SalaryRevision` fact. This is the third
occurrence of the same pattern established in ADR-0011 (hiring mutates
Employee) and ADR-0013 (completing an offboarding case terminates Employee):
`TenantAwareUnitOfWork.withTransaction()` always opens a new connection per
call, so a command-bus dispatch from inside an already-transactional handler
would split "the revision is recorded" and "the salary actually changed"
across two independent transactions — a real atomicity bug, not a style
preference. `libs/hr/compensation/infrastructure` therefore takes the same
deliberate, narrow dependency on `@abms/hr-payroll-domain`/
`@abms/hr-payroll-infrastructure` that Recruitment and Offboarding take on
`@abms/hr-domain`/`@abms/hr-infrastructure`.

### 2. `SalaryRevision` is a WORM fact record, not a stateful aggregate — mirrors `EmploymentHistoryEntry`

`SalaryRevision` has no mutators, emits no domain events, and is
reconstructed via `record()`/`reconstitute()` only — an exact structural
mirror of `EmploymentHistoryEntry` (`@abms/hr-domain`, ADR-0008). The
`salary_revision` table is RLS-enabled **and** has `UPDATE`/`DELETE` revoked
from the runtime role (`REVOKE UPDATE, DELETE ON "salary_revision" FROM
"abms_runtime"`), matching `employment_history`'s migration exactly — a
compensation history is exactly the kind of record that must be
un-editable after the fact, for the same audit-integrity reasons named in
`abos-domain-modules`'s WORM requirement. The integration test asserts this
revoke actually took effect (querying `information_schema.role_table_grants`
directly), not just that the migration ran.

### 3. Contribution rates are basis points, not float percentages

`BenefitPlan.employerContributionRateBasisPoints` (e.g. `500` = 5%) follows
the same convention already established for Payroll's statutory rates
(ADR-0010) rather than a float percentage field — "no floats for money,
ever" (per `abos-domain-modules`) extends to any rate that ultimately feeds
money arithmetic, even though v1 doesn't yet compute actual contribution
amounts (see Consequences).

### 4. One `ACTIVE` `BenefitEnrollment` per employee per plan, enforced at both the handler and the database level

`EnrollInBenefitHandler` checks
`IBenefitEnrollmentRepository.findActiveByEmployeeAndPlan()` and rejects
with `BusinessRuleViolationException` if one already exists, backed by a
partial unique index (`WHERE status = 'ACTIVE'`) on `(tenant_id,
employee_id, benefit_plan_id)` — the same defense-in-depth posture as
`OffboardingCase`'s one-active-case-per-employee index (ADR-0013, point 2)
and `PerformanceReview`'s duplicate-review guard (ADR-0012, point 3).
Cancelled enrollments remain as history and don't block a later, genuinely
new enrollment in the same plan (e.g. re-enrolling after a lapse).

### 5. Enrolling requires an active `BenefitPlan`

`EnrollInBenefitHandler` calls `plan.assertActive('enroll an employee')`
before creating the enrollment — a deactivated plan (e.g. discontinued by
the tenant) cannot accept new enrollments, though existing enrollments in
that plan are left untouched (deactivating a plan does not cascade-cancel
its enrollments in v1; see Consequences).

## Alternatives Considered

- **Dispatch a command through the command bus to Payroll from
  `RecordSalaryRevisionHandler`.** Rejected outright per point 1 — breaks
  transactional atomicity between the revision fact and the actual salary
  change, for the identical reason ADR-0011 and ADR-0013 rejected the
  equivalent approach for their own cross-module mutations.
- **Model `SalaryRevision` as a stateful aggregate with its own lifecycle
  (e.g. `PENDING_APPROVAL` → `APPROVED`).** Rejected for v1 per the Context
  section — no approval workflow exists yet; a revision is recorded and
  applied atomically as a fact, not proposed and reviewed. A future sprint
  introducing approval chains would supersede this, not extend it in place.
- **Store the contribution rate as a float percentage.** Rejected per
  point 3, consistent with the platform-wide no-floats-for-money rule.
- **Cascade-cancel active enrollments when a `BenefitPlan` is
  deactivated.** Rejected per point 5 — deactivation only blocks *new*
  enrollments in v1; cascading cancellation is a distinct, more disruptive
  operation that deserves its own explicit command if ever needed.

## Consequences

**Easier:** Compensation & Benefits now has a real, working v1 end-to-end
(set an initial salary structure → record a merit-increase revision →
confirm the live `SalaryStructure` actually changed while allowances are
preserved → create a benefit plan → enroll an employee → confirm a duplicate
enrollment and enrollment-in-an-inactive-plan are both rejected → cancel an
enrollment), verified via integration test (asserting the cross-aggregate
transaction lands both the `SalaryStructure` mutation and the WORM fact
correctly, the WORM revoke is real, and RLS policies exist on all three
tables) and a live HTTP smoke test covering the full flow plus both
rejection paths, correctly returning 422 and recorded as FAILURE rows in
`audit_log`, alongside every successful command's audit attribution.

**Harder / explicit follow-up work:**

- `RecordSalaryRevisionHandler`'s direct dependency on
  `hr-payroll-domain`/`hr-payroll-infrastructure` (point 1) is a deliberate,
  narrow exception, not a precedent for cross-sub-module coupling without
  the same atomicity justification — identical posture to ADR-0011/ADR-0013.
- No approval workflow for salary revisions — any authenticated user with
  API access can record (and immediately apply) a raise; this compounds the
  same open RBAC gap already flagged in ADR-0006 through ADR-0013.
- Benefit contribution rates are stored but never actually computed into a
  deduction/contribution amount anywhere — no integration with `Payslip`
  (Payroll) yet. A future sprint would need to decide whether benefit
  deductions become a new `Payslip` line item or a separate ledger entry.
- Deactivating a `BenefitPlan` does not cascade-cancel existing enrollments
  (point 5) — a tenant must cancel them individually if that's the intent.
- v1 is single-currency (TZS) per tenant, matching Payroll's own hardcoded
  convention (ADR-0010) — not yet revisited for multi-currency tenants.
