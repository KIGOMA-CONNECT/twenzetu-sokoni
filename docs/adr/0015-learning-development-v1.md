# ADR-0015: Learning & Development v1 — Course Catalog, Enrollments

**Status:** Accepted

**Date:** 2026-07-19

## Context

Continuing the HR & Workforce Suite build-out after Core HR, Leave &
Attendance, Payroll, Recruitment & Onboarding, Performance Management,
Offboarding, and Compensation & Benefits (ADR-0008 through ADR-0014),
Learning & Development is next per the domain memory
(`abms-enterprise-suites-architecture`), which lists it among the HR &
Workforce Suite's modules. v1 covers a tenant-defined course catalog and
employee enrollment/completion tracking. Explicitly **not** in v1: course
content delivery (video/document hosting), quizzes/assessments beyond a
single numeric score, prerequisite chains between courses, certification
expiry/renewal tracking, or linking course completion to Compliance
requirements — each is a distinct future scoping pass (the last one in
particular is a natural join point once Compliance & Reporting exists).

## Decision

### 1. `Course` and `CourseEnrollment` are structurally direct mirrors of `BenefitPlan`/`BenefitEnrollment` (ADR-0014)

A tenant-defined catalog entry (`Course`: title, description, duration,
category; `create()`/`deactivate()`) that employees enroll into
(`CourseEnrollment`: `enroll()`/`complete()`/`cancel()`), with a partial
unique index limiting one `IN_PROGRESS` enrollment per employee per course
at a time — the same catalog-plus-enrollment shape already proven twice in
this suite (`BenefitPlan`/`BenefitEnrollment`, ADR-0014; and structurally
`OnboardingTask`/`OffboardingTask`, ADR-0011/ADR-0013). Reusing a proven
shape here is a deliberate consistency choice, not a missed opportunity for
a different design — course enrollment genuinely has the same lifecycle
shape as benefit enrollment (join → progress → terminal state).

### 2. `Course` is entirely self-contained within `scope:hr` — no cross-sub-module dependency needed

Unlike Recruitment (ADR-0011), Offboarding (ADR-0013), and Compensation &
Benefits (ADR-0014), Learning & Development's handlers do not need to
mutate any other sub-module's aggregate in the same transaction — enrolling
in or completing a course only ever touches `Course`/`CourseEnrollment`
rows. `libs/hr/learning/infrastructure` therefore has no dependency on
`@abms/hr-domain`, `@abms/hr-payroll-domain`, or any other HR sub-module's
domain/infrastructure lib — the narrowest dependency footprint of any HR
sprint so far.

### 3. `CourseEnrollment.complete()` accepts an optional numeric score, not a structured assessment

`complete(completedDate, score)` takes a single `0-100` integer or `null` —
there is no rubric, no pass/fail threshold enforcement, and no
multi-attempt quiz model. This mirrors the same "smallest useful unit
first" discipline as `PerformanceReview`'s single 1-5 rating (ADR-0012,
point 6) — a course either records a completion score or it doesn't; more
structured assessment is a distinct future scoping pass, not a default.

## Alternatives Considered

- **Model course content/delivery (video hosting, document attachments) in
  this sprint.** Rejected — v1 proves the catalog and enrollment tracking
  data model; content delivery is a substantially different concern
  (storage, streaming, access control) that deserves its own scoping pass.
- **Link `CourseEnrollment` completion directly to a `ComplianceRequirement`
  now, ahead of Compliance & Reporting existing.** Rejected — building the
  join before the other side of it exists would guess at Compliance's
  eventual shape; the natural sequencing is to build Compliance next and
  decide the join then, informed by both aggregates actually existing.
- **Design a different enrollment lifecycle shape from Benefits/Onboarding
  for variety's sake.** Rejected per point 1 — matching an already-proven
  shape is the right call when the underlying process genuinely has the
  same structure; inventing a different shape would add cognitive load
  without a corresponding benefit.

## Consequences

**Easier:** Learning & Development now has a real, working v1 end-to-end
(create a course → enroll an employee → confirm a duplicate enrollment is
rejected → complete the enrollment with a score → deactivate the course →
confirm enrolling in a deactivated course is rejected), verified via
integration test (asserting completion state and score persist correctly,
plus RLS policies on both tables) and a live HTTP smoke test covering the
full flow plus both rejection paths, correctly returning 422 and recorded
as FAILURE rows in `audit_log`, alongside every successful command's audit
attribution. This is also the fastest sprint to build in the suite so far,
precisely because it needed no cross-module dependency (point 2) — a
useful data point for scoping future HR sub-modules that also turn out to
be self-contained.

**Harder / explicit follow-up work:**

- No course content delivery, prerequisites, or certification
  expiry/renewal — the catalog is metadata-only in v1.
- No structured assessment beyond a single optional score (point 3).
- No link to Compliance & Reporting yet — course completions that should
  satisfy a compliance requirement must be tracked manually until that join
  is designed.
- No role-based restriction on any `/hr/learning/*` route yet — matches the
  same open RBAC gap already flagged in ADR-0006 through ADR-0014 for every
  other Foundation/HR module.
