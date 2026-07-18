# ADR-0012: Performance Management v1 — Goals, Review Cycles, Performance Reviews

**Status:** Accepted

**Date:** 2026-07-19

## Context

Continuing the HR & Workforce Suite build-out after Core HR, Leave &
Attendance, Payroll, and Recruitment & Onboarding (ADR-0008/0009/0010/0011),
Performance Management is next per the domain memory
(`abms-enterprise-suites-architecture`), which lists "performance management,
learning & development" among the suite's modules. v1 scopes this to the
smallest useful slice: individual employee goals with manual progress
tracking, tenant-defined review cycles, and a single-reviewer performance
review per employee per cycle (DRAFT → SUBMITTED → ACKNOWLEDGED). Explicitly
**not** in v1: OKR-style goal hierarchies/key-results/weighting, multi-rater
(360°) reviews, calibration sessions or forced-distribution ranking, goal-to-
review linkage (a review does not aggregate or reference the goals set during
its cycle), and manager-approval chains beyond the single reviewer who starts
the review — each is a distinct future scoping pass.

## Decision

### 1. `Goal` is a flat aggregate with a single numeric progress field, not an OKR hierarchy

`Goal.set({employeeId, title, description, targetDate})` creates an `ACTIVE`
goal with `progressPercent: 0`; `updateProgress(percent)` is a direct,
manually-supplied 0-100 value — there is no key-results sub-structure, no
weighting, and no automatic roll-up from child goals. This matches the same
"ship the working core first" discipline as `SalaryStructure`'s flat
allowance list (ADR-0010) and `JobRequisition`'s single-`Position` scope
(ADR-0011): a manager can set a goal and track it, which is the smallest
useful unit, before any hierarchy/weighting model is designed.

### 2. `ReviewCycle` mirrors `PayrollPeriod`'s one-way `OPEN`→`CLOSED` lifecycle

`ReviewCycle.open({name, startDate, endDate})` → `close()`, with
`assertOpen()` guarding every operation that must happen while the cycle is
live (starting a new review). This is a direct structural reuse of
`PayrollPeriod`'s pattern (ADR-0010) — a tenant-scoped, time-boxed container
that transitions one-way from open to closed, with no reopen path in v1.

### 3. One `PerformanceReview` per employee per review cycle, enforced in the handler, not the aggregate

`StartPerformanceReviewHandler` loads the `ReviewCycle`, asserts it is open,
then calls `IPerformanceReviewRepository.findByEmployeeAndCycle(tenantId,
employeeId, reviewCycleId)` and throws `BusinessRuleViolationException` if a
review already exists — mirroring the duplicate-application guard pattern in
`SubmitApplicationHandler` (ADR-0011). This is also enforced at the database
level via a unique index on `(tenant_id, employee_id, review_cycle_id)`
(`1752000000032-CreatePerformanceReview.migration.ts`), so the handler-level
check is a friendlier 422 in front of a hard constraint, not the only line of
defense — the same defense-in-depth posture used everywhere else in this
codebase (e.g. `salary_structure`'s partial unique index, ADR-0010).

### 4. `reviewerUserId` is captured once, from the current user, at `start()` — never re-supplied

`StartPerformanceReviewCommand` deliberately does **not** take a
`reviewerUserId` parameter; `StartPerformanceReviewHandler` pulls it from
`ICurrentUserProvider.getCurrentUserId()` (the same pattern as
`ApprovePayslipHandler`/`ApproveLeaveRequestHandler` capturing the approving
user implicitly rather than trusting a client-supplied value). Once set, it
is immutable — `submit()` and `acknowledge()` operate on the existing review
and do not accept or change `reviewerUserId`. This closes an otherwise-live
spoofing gap: without this, any authenticated caller could submit a review
"as" an arbitrary reviewer by passing a different user ID in the request
body.

### 5. `PerformanceReview.start()` emits no domain event; `submit()` and `acknowledge()` do

Matching `Application`'s "only meaningful milestones get events" judgment
call (ADR-0011, point 3): starting a review is bookkeeping (a DRAFT row now
exists for someone to fill in), while submission and acknowledgement are the
state transitions an external system (e.g. a future notification service)
would plausibly want to react to. All three transitions are still fully
audited regardless, since `TransactionalCommandHandler` logs a SUCCESS/
FAILURE row per command independent of domain events (ADR-0006).

### 6. Rating is a single 1-5 integer with free-text comments — no rubric, no calibration

`PerformanceReview.submit(rating, comments)` Guards `rating` into `[1, 5]`
and stores free-text `comments`. There is no structured rubric (per-
competency scoring), no calibration/forced-distribution step across
reviewers, and no manager-of-manager approval chain — the reviewer who
started the review is the sole approver of its content via `submit()`, and
the employee's only action is `acknowledge()` (read receipt, not a
counter-signature or dispute mechanism).

## Alternatives Considered

- **Model goals as an OKR hierarchy (Objectives with weighted Key Results)
  from the start.** Rejected for v1 per point 1 — no evidence yet of what
  weighting/hierarchy model tenants actually need; a flat goal with manual
  progress proves the mechanism without prematurely committing to a schema.
- **Allow multiple performance reviews per employee per cycle (e.g. self-
  review + manager review as separate rows).** Rejected per point 3 — 360°/
  multi-rater review is real complexity (aggregating multiple raters' input
  into one outcome) that deserves its own design pass, not a default in v1.
- **Let the client supply `reviewerUserId` in `StartPerformanceReviewCommand`.**
  Rejected outright per point 4 — a real spoofing gap, not a style
  preference; the current-user-at-command-time pattern is already
  established elsewhere in this codebase for exactly this reason.
- **Emit a domain event on `start()` too, for symmetry with `submit()`/
  `acknowledge()`.** Rejected per point 5 — no current subscriber for "a
  review was started"; adding one speculatively would be unused surface
  area, matching the same reasoning already applied to `OnboardingTask`
  (ADR-0011, point 5).

## Consequences

**Easier:** Performance Management now has a real, working v1 end-to-end
(set a goal → update progress → complete it; open a review cycle → start a
review → submit → acknowledge), verified via integration test (asserting
goal completion state and review-lifecycle state land correctly, plus RLS
policies on all three tables) and a live HTTP smoke test covering the full
flow plus two rejection paths — a duplicate review for the same employee/
cycle pair, and starting a review against a closed cycle — both correctly
returning 422 and recorded as FAILURE rows in `audit_log`, alongside every
successful command's audit attribution (including `reviewerUserId` correctly
resolved from the JWT, not the request body).

**Harder / explicit follow-up work:**

- No OKR hierarchy, weighting, or automatic progress roll-up (point 1) —
  goals are flat and manually updated.
- No goal-to-review linkage — a `PerformanceReview` does not reference or
  summarize the `Goal` rows set during its cycle; a manager must consult both
  independently today.
- No 360°/multi-rater reviews, calibration, or forced-distribution ranking
  (point 3/6) — one reviewer, one rating, no cross-reviewer normalization.
- No structured rubric/per-competency scoring — `rating` is a single 1-5
  integer plus free text.
- No employee-side dispute or counter-comment mechanism —
  `acknowledge()` is a bare read receipt.
- No role-based restriction on any `/hr/performance/*` route yet — matches
  the same open gap already flagged in ADR-0006 through ADR-0011 for the
  other Foundation/HR modules.
