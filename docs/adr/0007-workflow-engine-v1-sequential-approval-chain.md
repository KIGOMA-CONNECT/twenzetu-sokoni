# ADR-0007: Workflow Engine v1 — Sequential, Role-Based Approval Chain

**Status:** Accepted

**Date:** 2026-07-14

## Context

The user explicitly requested a Workflow Engine as a Foundation-layer sprint
("tuongeze Workflow Engine/Audit-WORM kama Foundation sprint kabla ya HR"),
alongside Audit/WORM (ADR-0006), before proceeding to the HR & Workforce
Suite. The Enterprise Capability Map (Constitution Ch. 6) already flags
Workflow Engine as a capability nearly every future Business Suite depends on
(approval chains for procurement, budget, HR onboarding, etc.), so it needed
to land as a genuinely reusable foundation-tier primitive, not something
bolted onto a single suite.

A full workflow engine (parallel branches, conditional routing, escalation,
SLAs, dynamic step insertion) is a multi-sprint effort. Given the immediate
need — organization/HR/procurement actions requiring one or more sequential
approvals by role — v1 deliberately scopes down to the smallest primitive
that is still genuinely useful and won't need a breaking rework later:
**a single, linear, role-gated approval chain.**

## Decision

### 1. Two aggregates: `WorkflowDefinition` (the template) and `WorkflowInstance` (a running approval)

`WorkflowDefinition` (`libs/workflow/domain`) holds an ordered list of steps,
each just `{ stepOrder, approverRole }` — built automatically from an
ordered `approverRoles: string[]` array passed to `create()`, so callers
never manually assign `stepOrder` (eliminates an entire class of off-by-one/
gap bugs). `WorkflowInstance.start()` snapshots a `WorkflowDefinition`'s
steps into its own `WorkflowStepApproval[]` (adding `status`,
`decidedByUserId`, `decidedAt`, `comment` per step) — instances do **not**
hold a live reference to the definition, so editing a definition later never
retroactively changes an in-flight instance's approval chain. (v1 has no
`update` on `WorkflowDefinition` at all, so this is currently moot, but the
snapshot design is correct regardless of when editing is added.)

### 2. `approverRole` is a plain `string`, not identity's `UserRole` enum — enforced by the Nx dependency graph

`libs/workflow` is foundation-tier (`scope:workflow`, sitting alongside
`scope:cqrs`/`scope:audit` in the depConstraint chain); `libs/identity` is
bounded-context tier and already depends on `scope:workflow` (for a future
HR-approval integration). Typing `approverRole` against identity's
`UserRole` would invert that dependency and is structurally impossible
without breaking the layering `eslint.config.mjs` already enforces. The
aggregate itself still enforces role-correctness at approval time
(`WorkflowInstance.approveStep`/`rejectStep` throw
`BusinessRuleViolationException` if the caller's role doesn't match the
current step's `approverRole`) — the type is loose, but the domain
invariant is not.

The same reasoning applies to `WorkflowController` (`libs/workflow/api`):
it needs `{ userId, role }` from the authenticated request but cannot import
identity's `AuthenticatedRequestUser` type. It declares a local, structurally
-compatible `CurrentUser` interface instead and casts `request.user` to it —
TypeScript's structural typing makes this safe without an import edge.
`AuthGuard('jwt')` itself is the generic `@nestjs/passport` factory (looked
up by strategy name against the process-wide Passport registry), so applying
it here — exactly as already done for `OrganizationController` — creates no
`scope:workflow -> scope:identity` edge either.

### 3. Steps are stored as `jsonb`, not a child table

Unlike `OrgUnitType.allowedParentTypeIds` (a genuine many-to-many needing its
own join table, per ADR-0004's precedent), a `WorkflowDefinition`'s or
`WorkflowInstance`'s steps are an ordered, aggregate-internal list that is
never queried independently of its parent — there is no use case for "find
all steps with role X across every workflow." A `jsonb` column
(`workflow_definition.steps`, `workflow_instance.steps`) round-trips through
TypeORM automatically and keeps the repository free of the extra
delete-then-reinsert join-table dance `TypeOrmOrgUnitTypeRepository` needs.
If a future sprint needs to query/report on individual steps across
instances, this can be revisited then — a `jsonb` column is trivially
migratable to a proper table later; it is not a one-way door.

### 4. Rejection ends the whole instance immediately; approval advances one step at a time

`rejectStep()` sets the entire `WorkflowInstance.status` to `REJECTED` as
soon as any single step is rejected — remaining steps are left `PENDING`
forever (they simply never get evaluated; this accurately reflects reality,
not a bug). `approveStep()` only completes the instance
(`status = 'APPROVED'`) once every step has been approved; until then it
stays `PENDING`. Both mutators reject out-of-order step numbers (`stepOrder`
must exactly match the current first-`PENDING` step) — a domain-level
sequential-enforcement guard, not just an application-layer check.

### 5. Domain events are actually wired to the event bus this time — a gap fixed, not replicated

Investigation while building this (see Explore-agent research, this
session) found that **none** of the existing Organization command handlers
call `ctx.addEvent(...)` for the domain events their aggregates collect —
`AggregateRoot.domainEvents`, `ITransactionContext.addEvent()`, and
`TransactionalCommandHandler`'s post-commit `eventBus.publishAll(ctx.events)`
are all fully wired end-to-end in `libs/kernel`/`libs/cqrs`/`libs/database`,
but Organization's handlers simply never call the one method
(`ctx.addEvent(event)`) that connects an aggregate's collected events to
that pipeline — so no Organization domain event has ever actually reached
the event bus. Every workflow command handler explicitly does
`for (const event of aggregate.domainEvents) ctx.addEvent(event);` before
returning, closing this gap for workflow from day one (`WorkflowDefinitionCreatedEvent`,
`WorkflowInstanceStartedEvent`, `WorkflowStepApprovedEvent`,
`WorkflowStepRejectedEvent`, `WorkflowInstanceCompletedEvent` are all
genuinely published). This matters concretely for workflow because the
Notification Engine (not yet built) will need to subscribe to
`workflow.instance.step-approved` etc. to actually notify the next
approver — that integration is impossible if the events never leave the
aggregate. Organization's own gap is **not** fixed by this ADR (out of
scope) — flagged here as a known, pre-existing defect worth a follow-up.

## Alternatives Considered

- **Parallel/multi-branch approval steps in v1.** Rejected: no concrete use
  case has been specified yet, and the linear model is the strict subset —
  adding branching later is additive (a new `WorkflowStepTemplate` shape),
  not a breaking migration of the existing linear one.
- **A pluggable, identity-typed `approverRole`** via a `CURRENT_USER_ROLE`
  AsyncLocalStorage-based store (mirroring `AsyncLocalCurrentUserStore` from
  ADR-0006), so role wouldn't need to travel through the command explicitly.
  Rejected for v1: role is only needed by the two step-decision commands,
  not universally like tenant/user id are; adding a second ambient
  async-context store for a two-command use case is premature generality.
  Passing `approverRole` explicitly through the command (sourced from
  `request.user.role` in the controller) is simpler and just as correct.
- **A workflow_definition_step child table** (matching the
  `org_unit_type_allowed_parent` precedent exactly). Rejected per point 3
  above — no independent-query use case exists yet, and `jsonb` is strictly
  less code for the same correctness today.
- **Optimistic-lock (`expectedVersion`) checks on `approveStep`/`rejectStep`**,
  matching the pattern some Organization profile-update commands use.
  Deferred, not rejected outright: v1 relies on ordinary transactional
  read-then-write within `TenantAwareUnitOfWork.withTransaction` (the same
  posture several existing Organization mutators — `rename`, `deactivate`,
  `reactivate` — already take, i.e. this is not a new gap unique to
  workflow). A concurrent double-approval race is a real but narrow edge
  case; add explicit version-conflict handling if it proves to matter in
  practice.

## Consequences

**Easier:** every future business suite (HR onboarding, procurement PO
approval, budget sign-off) gets a ready-made sequential approval primitive
without building bespoke state machines per module — just define an ordered
list of approver roles and call `StartWorkflowCommand` with a
`subjectType`/`subjectId` pointing at whatever domain object needs approval.
Domain events genuinely publish, so the eventual Notification Engine has a
real integration point from day one.

**Harder / explicit follow-up work:**

- No role-based restriction on *which* roles may call `POST /workflows/definitions`
  itself (any authenticated user can define a new approval chain) — mirrors
  the same open gap flagged in ADR-0006 for Organization routes; both should
  likely be resolved together once a per-route role policy is decided.
- No parallel steps, no conditional/dynamic routing, no step reassignment or
  escalation/SLA timers — all explicitly out of scope for v1, to be added
  only when a concrete business suite actually needs them.
- No optimistic-lock guard on step decisions (see Alternatives Considered) —
  acceptable today, worth revisiting if concurrent-approval races are
  observed in practice.
- `subjectId` is a plain opaque string with no FK to the actual subject
  table (mirrors the same deferred-integrity posture ADR-0004 already
  established for `OrgUnit.parentId` etc.) — a workflow instance pointing at
  a deleted `OrgUnit` is not currently prevented at the DB level.
