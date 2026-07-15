# ADR-0009: Leave & Attendance v1 — Balances, Requests, Clock In/Out

**Status:** Accepted

**Date:** 2026-07-15

## Context

Per ADR-0008's sequencing (Core HR first, then Leave/Attendance/Performance,
Payroll, and Recruitment/Onboarding as equally near-term priorities, chosen
by the user via "combine both option 1 to 3"), Leave & Attendance is the
first HR sub-module built after Core HR. It was chosen over Payroll and
Recruitment/Onboarding as the immediate next slice because it is
high-frequency (used daily, unlike Payroll's monthly cadence), and because it
naturally exercises the already-built Workflow Engine's decision-making
shape (submit → approve/reject) without yet requiring Workflow's full
multi-step chain machinery.

Scope for v1: leave types (a tenant-defined catalog), a per-employee/
leave-type/year balance ledger, leave requests with a single-decision
approve/reject/cancel lifecycle, and attendance records (clock in/out plus
manually-entered absence/late/half-day). Explicitly **not** in v1: multi-step
approval chains, leave accrual schedules (pro-rated monthly accrual,
carry-over rules), attendance-based payroll integration, or shift/roster
management — each is a distinct future scoping pass.

## Decision

### 1. New nested lib `libs/hr/leave-attendance/*`, inside the `scope:hr` tier — not a new bounded-context tier

Per ADR-0008's stated intent ("future HR sub-modules... are expected to grow
as new libs within `scope:hr`"), this sprint implements that: `libs/hr/leave-attendance/{domain,application,infrastructure,api}` sits one
directory level deeper than `libs/hr/*` but carries the same `scope:hr` Nx
tag, not a new tier. It depends on the foundation chain
(kernel/core/tenancy/database/audit/cqrs/workflow) exactly like `libs/hr`
does, but **not** on `libs/hr` itself — `Employee` is referenced only by
opaque `employeeId: EntityId` values (Postgres-level `FOREIGN KEY` to
`employee.id` in the migrations, but no Nx/TypeScript dependency edge to
`hr-domain`/`hr-infrastructure`). This mirrors the same opaque-cross-reference
posture ADR-0008 already established for `Employee.userId`/`Employee.orgUnitId`,
now applied one level down.

### 2. `LeaveBalance` is a separate aggregate from `LeaveRequest`, not a computed projection

A balance is an entitlement ledger (`allocatedDays`, `usedDays`) that many
requests draw against over a year, and that can be corrected independently
of any single request (a manual top-up, a mid-year policy change via
`adjustAllocation()`). Modeling it as one row per
`(tenantId, employeeId, leaveTypeId, year)` — rather than deriving "days
used" by summing approved `LeaveRequest` rows on every read — makes the
debit/credit operations atomic and auditable at the point of decision, and
avoids an expensive aggregate query on every balance check.

### 3. Leave approval is a same-aggregate decision, not routed through the Workflow Engine — deferred, not rejected

`LeaveRequest.approve()`/`reject()` are plain domain methods on the
`LeaveRequest` aggregate itself (`PENDING` → `APPROVED`/`REJECTED`, guarded
by `assertPending()`), not a `WorkflowInstance` created via
`StartWorkflowCommand` with a subscriber reacting to
`WorkflowStepApprovedEvent` to call back into `LeaveRequest`. Wiring
leave approval through Workflow would require cross-module saga
coordination (two aggregates whose state must stay consistent across an
async event boundary) for a v1 whose actual approval shape is a single
yes/no decision — the same "ship the working core first" discipline already
applied to Workflow v1 itself (ADR-0007) and Core HR v1 (ADR-0008). When a
future sprint needs genuinely multi-step leave approval (e.g. manager then
HR), that is the point to route `LeaveRequest` through `WorkflowInstance`
rather than growing a second, bespoke multi-step mechanism inside
`LeaveRequest` itself.

**Direct consequence**: `LeaveRequest.cancel()` also only guards
`assertPending()` — an already-`APPROVED` request cannot be cancelled in v1
(and its debited balance cannot be credited back via cancellation). This is
a real, accepted v1 gap, not an oversight — see Consequences.

### 4. Balance debit happens at approval time, not at submission time

`ApproveLeaveRequestHandler` loads the matching `LeaveBalance` (keyed by
`employeeId`, `leaveTypeId`, and the request's `startDate` year),
calls `balance.debit(request.numberOfDays)`, saves it, then calls
`request.approve(...)` — both in the same transaction. Submitting a request
does not reserve/hold days against the balance; only approval consumes them.
This means two overlapping pending requests can both show a healthy balance
right up until one of them is approved, at which point the other may fail to
approve if it would overdraw (`LeaveBalance.debit()`'s guard). Accepted for
v1 — a "soft hold" on submission is a natural v2 enhancement once real usage
surfaces whether double-booking is a practical problem.

### 5. No WORM on `leave_balance`/`leave_request`/`attendance_record` — RLS only, unlike `employment_history`

Unlike `employment_history` (ADR-0008), which is an append-only timeline and
combines RLS with WORM, these three tables hold current, legitimately
mutable state (a balance's `usedDays`, a request's `status`/`decidedAt`, an
attendance record's `clockOutTime`/`hoursWorked` filled in after the row
already exists). All four Leave & Attendance migrations enable RLS only.
The audit trail for *who* changed *what* remains `audit_log` (ADR-0006),
which already captures every command with SUCCESS/FAILURE and the acting
`user_id` — a separate concern from whether the underlying row itself is
immutable.

### 6. Numeric columns are TypeORM `string`, explicitly converted at the repository boundary

Postgres `numeric` columns (`default_days_per_year`, `allocated_days`,
`used_days`, `number_of_days`, `hours_worked`) are typed `string`/
`string | null` on the ORM entities (TypeORM's default mapping, to avoid
float precision loss) but `number`/`number | null` on the domain aggregates.
Every repository's `toDomain()` mapper calls `Number(row.xxx)`, and every
`save()` calls `.toString()` on the domain value — verified explicitly in
each repository's unit spec (e.g. `TypeOrmLeaveBalanceRepository`'s spec
asserts `allocatedDays: '21'` is what gets passed to `.save()`, and that
`'21.0'` in a mocked row reconstitutes to the number `21`).

## Alternatives Considered

- **Route leave approval through the Workflow Engine from day one.** Rejected
  per point 3 — the added cross-module saga complexity isn't justified when
  v1's actual approval shape is single-step. Revisit when multi-step leave
  approval is an actual, not hypothetical, requirement.
- **Derive `LeaveBalance.usedDays` by summing approved `LeaveRequest` rows on
  read, instead of a persisted ledger.** Rejected per point 2 — loses
  atomicity for the debit/credit operation and the ability to manually
  correct a balance independent of any request.
- **Reserve/hold balance at submission time instead of at approval time.**
  Rejected for v1 per point 4 — adds a "held vs. used" distinction to
  `LeaveBalance` that isn't justified without evidence double-booking is a
  real problem; a straightforward follow-up if it becomes one.
- **Allow cancelling an already-approved request, crediting the balance back.**
  Rejected for v1 — `LeaveRequest`'s state machine is deliberately minimal
  (`assertPending()` guards every transition); an approved-then-cancelled
  flow needs its own explicit design (does it need a second approval? a
  reason code?) rather than being bolted on as a side effect of relaxing a
  guard.
- **WORM on `leave_request` to preserve a tamper-proof decision history.**
  Rejected per point 5 — these are current-state tables, not timelines;
  `audit_log` already covers who-changed-what accountability without making
  the operational rows themselves immutable.

## Consequences

**Easier:** Leave & Attendance now has a real, working v1 end-to-end (leave
type → balance → request → approve/reject/cancel, and clock-in/clock-out
with computed `hoursWorked`), verified via integration test and a live HTTP
smoke test showing correct balance debiting and full audit attribution.
Payroll (next in the "combine 1-3" sequence) can eventually read approved
leave and attendance data once it exists.

**Harder / explicit follow-up work:**

- An approved `LeaveRequest` cannot be cancelled, and a cancelled request
  never had its balance debited in the first place (debit happens at
  approval) — so no credit-back path exists yet. A future "revoke approved
  leave" flow needs explicit design, not just relaxing `assertPending()`.
- No accrual engine — `LeaveBalance.allocatedDays` is set once via
  `AllocateLeaveBalanceCommand` (a flat annual grant), not accrued
  month-by-month or carried over across years.
- No soft-hold at submission time (point 4) — two pending overlapping
  requests can both look approvable until one actually is.
- Multi-step leave approval (e.g. manager → HR) is not supported; v1 is a
  single approve/reject decision by whoever calls the endpoint (no
  role-based restriction on who may approve, matching the same open gap
  already flagged in ADR-0006/0007/0008 for Organization/Workflow/HR).
- `attendance_record` has no shift/roster awareness — `clockIn()`/`recordManual()`
  key off calendar date only, with a unique
  `(tenant_id, employee_id, date)` constraint that assumes one record per
  employee per day.
