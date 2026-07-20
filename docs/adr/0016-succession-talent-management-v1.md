# ADR-0016: Succession & Talent Management v1 — Plans, Candidate Nominations

**Status:** Accepted

**Date:** 2026-07-20

## Context

Continuing the HR & Workforce Suite build-out after Core HR, Leave &
Attendance, Payroll, Recruitment & Onboarding, Performance Management,
Offboarding, Compensation & Benefits, and Learning & Development (ADR-0008
through ADR-0015), Succession & Talent Management is next per the domain
memory (`abms-enterprise-suites-architecture`), which lists it among the HR
& Workforce Suite's modules. v1 covers succession planning for a critical
`Position` — opening a plan, nominating employee candidates with a
readiness level, and updating that readiness over time. Explicitly **not**
in v1: 9-box talent grids, formal calibration sessions across managers,
linking succession readiness to Performance Management's review data,
automated "flight risk" scoring, or a broader talent pool concept
independent of a specific position's succession plan — each is a distinct
future scoping pass.

## Decision

### 1. `SuccessionPlan`/`SuccessionCandidate` are opaque-FK, self-contained within `scope:hr` — the same posture as Leave & Attendance/Payroll, not the Recruitment/Offboarding/Compensation exception

`SuccessionPlan.positionId` and `SuccessionCandidate.employeeId` are plain
`EntityId` values with no TypeScript dependency on `@abms/hr-domain` or
`@abms/hr-infrastructure` — the migrations declare raw-SQL foreign keys to
`position`/`employee` for referential integrity, but no handler in this
sprint needs to load or mutate the `Position` or `Employee` aggregate in
the same transaction. This is a deliberate return to the narrower
dependency footprint established by Leave & Attendance (ADR-0009) and
Payroll (ADR-0010), not the cross-module direct-mutation exception used by
Recruitment (ADR-0011), Offboarding (ADR-0013), and Compensation & Benefits
(ADR-0014) — succession planning genuinely doesn't need to change an
Employee or Position's own state, only reference them.

### 2. One `OPEN` plan per position at a time, enforced by the handler + a partial unique index

`OpenSuccessionPlanHandler` checks `ISuccessionPlanRepository.findOpenByPosition()`
and rejects with `BusinessRuleViolationException` if one already exists,
backed by a partial unique index (`WHERE status = 'OPEN'`) on `(tenant_id,
position_id)` — the same defense-in-depth posture as `OffboardingCase`
(ADR-0013, point 2) and `BenefitEnrollment` (ADR-0014, point 4). A closed
plan doesn't block a later, genuinely new planning cycle for the same
position.

### 3. `SuccessionCandidate` removal is a hard delete, not a status transition

Unlike every other "enrollment-shaped" aggregate in this suite
(`CourseEnrollment`, `BenefitEnrollment`, `OnboardingTask`/`OffboardingTask`),
`RemoveSuccessionCandidateCommand` calls `IRepository.delete()` directly
rather than the aggregate transitioning to a terminal status. A candidate
roster entry has no meaningful history worth retaining once removed — being
removed from consideration isn't an event a future system would want to
query for (unlike, say, a cancelled benefit enrollment, which is a genuine
historical fact about coverage). The uniqueness constraint is therefore a
plain (non-partial) unique index on `(tenant_id, succession_plan_id,
employee_id)`, since there's no "cancelled but still present" row to
exclude.

### 4. Readiness level is a fixed four-value enum, not a numeric scale

`ReadinessLevel = 'READY_NOW' | 'READY_1_2_YEARS' | 'READY_3_5_YEARS' |
'NOT_READY'` mirrors standard succession-planning taxonomy (the same
buckets used in common 9-box/readiness frameworks) rather than an arbitrary
numeric score — this is a domain-standard classification, not a novel
scale this platform is inventing, so using the industry-recognized labels
directly is more legible than reducing them to numbers.

## Alternatives Considered

- **Give `SuccessionCandidate` the same cross-module Employee-mutation
  treatment as Recruitment/Offboarding/Compensation.** Rejected per point 1
  — nothing in this sprint's scope requires mutating Employee or Position
  state; introducing that dependency would be unjustified coupling with no
  corresponding correctness need.
- **Model candidate removal as a `WITHDRAWN` status instead of a hard
  delete.** Rejected per point 3 — no identified consumer needs "who was
  once nominated but removed" history; adding a status here would be
  speculative complexity without a grounded requirement, unlike
  `BenefitEnrollment.cancel()` where a cancelled-coverage record has
  obvious audit value.
- **Use a numeric readiness score (e.g. 1-4) instead of named levels.**
  Rejected per point 4 — succession planning has well-established named
  readiness buckets in the domain; matching that vocabulary is clearer than
  inventing a numeric scale, unlike `PerformanceReview`'s 1-5 rating
  (ADR-0012) which had no equivalent standard taxonomy to defer to.
- **Link candidate readiness to Performance Management's review data now.**
  Rejected — building that join before deciding its shape would guess;
  natural sequencing is to let both modules mature independently first.

## Consequences

**Easier:** Succession & Talent Management now has a real, working v1
end-to-end (open a plan for a position → nominate a candidate → confirm a
duplicate nomination and a duplicate open plan are both rejected → update
the candidate's readiness → remove the candidate → close the plan),
verified via integration test (asserting readiness updates persist
correctly, plus RLS policies on both tables) and a live HTTP smoke test
covering the full flow plus both rejection paths, correctly returning 422
and recorded as FAILURE rows in `audit_log`, alongside every successful
command's audit attribution.

**Harder / explicit follow-up work:**

- No 9-box grid, calibration workflow, or cross-manager review process —
  readiness is set unilaterally by whoever calls the API.
- No link to Performance Management — a candidate's actual review history
  or goal completion isn't factored into or displayed alongside readiness.
- No broader talent-pool concept independent of a specific position's plan
  — an employee can only be tracked as a candidate in the context of an
  open succession plan for a position, not as a general "high potential"
  flag.
- No role-based restriction on any `/hr/succession/*` route yet — matches
  the same open RBAC gap already flagged in ADR-0006 through ADR-0015 for
  every other Foundation/HR module.
