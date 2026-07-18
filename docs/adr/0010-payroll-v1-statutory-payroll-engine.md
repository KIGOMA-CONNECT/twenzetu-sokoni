# ADR-0010: Payroll v1 — Salary Structures, Payroll Periods, Payslips (Tanzania Statutory Engine)

**Status:** Accepted

**Date:** 2026-07-18

## Context

Per ADR-0008/ADR-0009's "combine 1-3" sequencing (Core HR done, then Leave/
Attendance/Performance, Payroll, and Recruitment/Onboarding as equally
near-term priorities), Payroll is the next slice after Leave & Attendance.
Per the domain memory (`abos-domain-modules`/`abms-enterprise-suites-architecture`),
Payroll's target shape is "salary, allowances, overtime, PAYE, NSSF, WCF,
NHIF/Bima, loans, advances, deductions" — a full statutory payroll engine for
Tanzania. v1 scopes this to: a per-employee salary structure (basic salary +
named allowances), payroll periods with an open/closed lifecycle, and a
payslip gross-to-net computation (PAYE, employee/employer NSSF, employer WCF,
employer SDL) with a DRAFT → APPROVED → PAID lifecycle. Explicitly **not**
in v1: overtime, bonuses/commissions, loans/advances/other deductions,
NHIF/Bima, leave-without-pay integration with the just-built Leave &
Attendance module, multi-currency, bank payment file generation, or TRA
e-filing integration — each is a distinct future scoping pass.

## Decision

### 1. Money arithmetic added to the shared kernel `Money` VO, not reimplemented locally

Payroll is the first module to actually need money *arithmetic* (sum
allowances, subtract deductions, take a percentage) rather than just storing
and displaying an amount (Money's only capability before this sprint — see
ADR-0004). Per the platform-wide "no floats for money, ever" rule (domain
memory, `abos-domain-modules`), `Money.add()`/`subtract()`/`percentageOf()`/
`isGreaterThan()`/`isZero()` were added directly to `libs/kernel`'s `Money`
class rather than duplicated inside `libs/hr/payroll`. All five operate on a
scaled-`BigInt` representation of the decimal string (scaled by 10,000 to
match Money's own max-4-fraction-digit precision) — never a JS `number` —
and `percentageOf()` takes basis points (e.g. `800` = 8%), not a float
percentage, so the rate itself can't introduce error either. This is a
minimal, backward-compatible extension (no existing Money call site
changed) that every future money-handling module (Finance, Procurement,
Budget) can reuse rather than reinventing.

### 2. `PayrollCalculator` is a stateless domain service; statutory rates are injected data, not hardcoded constants

`PayrollCalculator.calculatePaye(grossPay, payeBands)` walks an ordered list
of `PayeTaxBand { lowerBound, upperBound, rateBasisPoints }` and sums the
marginal tax owed in each band the gross pay reaches — a pure function,
independently unit-tested against known band configurations. The actual
rate *values* (PAYE bands, NSSF/WCF/SDL percentages) live in
`createTanzaniaStatutoryRatesV1()`, a factory function returning a
`StatutoryRates` object, not inlined into the calculator or hardcoded into
handlers. **Explicit caveat, stated here and in the source comments**: the
default rates in `createTanzaniaStatutoryRatesV1()` are commonly-cited
post-2023-Finance-Act reference figures as of when this code was written —
they have **not** been verified against a current, authoritative TRA/NSSF/
WCF/SDL source, and tax law changes yearly. This is a starting configuration
to confirm or replace before any real payroll run, not a guaranteed-current
legal fact. A future sprint should make the rate schedule admin-configurable
and versioned by effective date rather than a single hardcoded factory
function — deferred here to keep v1's actual scope (the computation engine
and payslip lifecycle) shippable.

### 3. Balance debit at approval time (Leave) has no analogue here — deductions are computed once, at payslip generation

Unlike `LeaveRequest` (ADR-0009), where the balance is debited at a later
approval step, `Payslip.generate()` computes PAYE/NSSF/WCF/SDL/netPay
immediately from the salary structure snapshot — `approve()`/`markPaid()`
are pure status transitions afterward with no further computation. This
is simpler because there's no shared ledger a payslip draws against (unlike
`LeaveBalance`); each payslip is self-contained once generated.

### 4. Employer-only costs (NSSF-employer, WCF, SDL) are carried on the Payslip as informational fields, never deducted from net pay

`Payslip.netPay = grossPay - (payeAmount + nssfEmployeeAmount)` only.
`nssfEmployerAmount`/`wcfEmployerAmount`/`sdlEmployerAmount` are computed and
persisted for the eventual GL-posting/Finance integration (not built yet —
Foundation Layer gap, per Constitution Ch. 6) but never subtracted from what
the employee is owed, since they are the employer's cost, not the
employee's deduction.

### 5. `salary_structure`/`payroll_period`/`payslip` — RLS only, no WORM; a DB-level partial-unique-index backstop on "one active structure per employee"

Like Leave & Attendance's tables (ADR-0009 point 5), these hold current,
legitimately mutable state (a payslip's `status`/`approvedAt`, a period's
`status`), not an append-only timeline, so only RLS is applied — `audit_log`
(ADR-0006) remains the accountability trail. `salary_structure` additionally
gets `CREATE UNIQUE INDEX ... WHERE is_active = true` on
`(tenant_id, employee_id)` — a DB-level backstop for the "one active
structure per employee" invariant the command handler also checks, so a
race between two concurrent `SetSalaryStructureCommand` calls fails loudly
at the database rather than silently leaving two active rows.

### 6. `libs/hr/payroll/*` — another nested lib inside `scope:hr`, `employeeId` as an opaque FK

Continues the pattern ADR-0008 established and ADR-0009 already applied
once: `libs/hr/payroll/{domain,application,infrastructure,api}` carries the
`scope:hr` tag (not a new tier), depends on the foundation chain, and does
**not** depend on `libs/hr` (Core HR) or `libs/hr/leave-attendance`
directly — `employeeId: EntityId` is opaque at the domain/TypeScript level,
with a real Postgres `FOREIGN KEY` to `employee.id` at the migration level
only. The integration test inserts a minimal `employee` row via raw SQL for
the same reason Leave & Attendance's integration test does (ADR-0009):
pulling in `hr-infrastructure` just for a test fixture would violate the
same boundary the production code deliberately respects.

### 7. Allowances stored as `jsonb`, not a child table

`SalaryStructure.allowances`/`Payslip.allowances` are small embedded lists
(`{name, amount}[]`) that are never independently queried, filtered, or
referenced by ID — the same reasoning already applied to `WorkflowDefinition.steps`
(ADR-0007) and Leave & Attendance's own allowance-shaped data. A child table
would add join complexity for zero query benefit here.

## Alternatives Considered

- **Hardcode Tanzania's current PAYE/NSSF/WCF/SDL rates as constants inside
  `PayrollCalculator` itself.** Rejected per point 2 — couples pure
  calculation logic to a specific, time-bound set of legal figures; injecting
  `StatutoryRates` keeps the calculator testable against arbitrary band
  configurations and makes the eventual "admin-configurable rate schedule"
  enhancement additive rather than a rewrite.
- **Reimplement money-safe arithmetic locally inside `libs/hr/payroll`
  instead of extending the shared `Money` VO.** Rejected per point 1 — this
  is exactly the kind of foundational capability (per the user's engineering
  principles) that should live once in the kernel for every future
  money-handling module to reuse, not be duplicated per-module.
- **Deduct NSSF-employer/WCF/SDL from net pay alongside PAYE and
  NSSF-employee.** Rejected — these are legally the employer's cost, not the
  employee's; conflating them would produce an incorrect net pay figure.
- **WORM the `payslip` table, treating an issued payslip as an immutable
  record once generated.** Rejected for v1 per point 5 — the
  DRAFT→APPROVED→PAID lifecycle requires genuine mutation of the same row;
  `audit_log` already provides who-changed-what accountability without
  freezing the operational row itself. A future "payslip correction" flow
  might revisit this once the lifecycle needs a formal void/reissue path.

## Consequences

**Easier:** Payroll now has a real, working v1 end-to-end (salary structure
→ open period → generate payslip → approve → pay), verified via integration
test and a live HTTP smoke test confirming the exact expected PAYE/NSSF/net
figures, closed-period rejection, and full audit attribution including the
correctly-recorded FAILURE entry for a rejected generate-on-closed-period
attempt. The `Money` arithmetic extension is immediately available to any
future Finance/Procurement/Budget work.

**Harder / explicit follow-up work:**

- **Statutory rate accuracy is not verified** (point 2) — this is the most
  important caveat in this ADR. Before any real payroll run, a qualified
  Tanzania payroll/tax professional must confirm or correct the PAYE bands
  and NSSF/WCF/SDL percentages in `createTanzaniaStatutoryRatesV1()`.
- No accrual/loans/advances/other-deductions support — `netPay` is purely
  `grossPay - PAYE - employeeNSSF`.
- No leave-without-pay integration with Leave & Attendance (ADR-0009) — a
  payslip does not currently reduce basic salary for unpaid leave days taken
  in the period.
- No overtime, bonus, or commission pay components — `SalaryStructure` is
  basic salary plus a flat allowance list only.
- No bank payment file generation or TRA e-filing integration — `markPaid()`
  is a manual status transition, not connected to any actual payment rail.
- No role-based restriction on any `/hr/payroll/*` route yet — matches the
  same open gap already flagged in ADR-0006/0007/0008/0009 for the other HR
  sub-modules.
