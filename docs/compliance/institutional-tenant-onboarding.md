# Institutional Tenant Onboarding — Runbook

Applies to onboarding a real second tenant (an institution such as a business, cooperative,
or government entity) onto the live platform. This runbook is **documentation + verification
tooling**; provisioning is executed deliberately and never blindly against production.

## Purpose

Onboard an institutional tenant with correct tenancy, isolation, configuration, and
observability — and prove each property with the verification script — without risking the
default tenant's data.

## Prerequisites

- An operator with database access to the production host and a platform admin account.
- A signed tenant contract + **Data Processing Agreement (DPA)** before any data is ingested
  (see [enterprise-readiness.md](enterprise-readiness.md) §3 — P1 gap; do not onboard before
  the DPA template exists, or record the explicit waiver).
- The institution's brand assets, contact details, operator accounts, and service catalogue.

## Roles

| Role | Responsibility |
| --- | --- |
| Platform admin | Approves onboarding, provisions operators, monitors go-live |
| Operator | Runs provisioning steps below, owns the tenant |
| Engineer | Executes DB provisioning + verification; on-call during go-live |

## Phase 0 — Approve & record

1. Confirm the contract/DPA is signed; record the decision (audit action `tenant.onboard.approved` once audit coverage lands).
2. Confirm the tenant name and desired identifier (we use UUIDs; no external naming).

## Phase 1 — Provision the tenant

A tenant is a row in `tenants` with `is_default = false`. Today there is no admin endpoint for
this (tracked gap), so provisioning is SQL against the production DB or the public
`POST /auth/register-tenant` (rate-limited, no DPA gating — prefer direct SQL for institutional
onboarding so the record and defaults are explicit).

```sql
-- run in the postgres container as the bootstrap user
INSERT INTO tenants (id, name, status, is_default, created_at, updated_at)
VALUES (gen_random_uuid(), '<INSTITUTION NAME>', 'ACTIVE', false, NOW(), NOW())
RETURNING id;
```

Capture the returned `id` — every subsequent step uses it.

## Phase 2 — Configure

1. **Country / currency config** — confirm `country_configs` has the institution's country
   (`TZ` exists; add others if the institution operates elsewhere).
2. **Branding & marketing** — set category tagline/benefits/emoji via the marketing console or
   `PATCH /categories/:id/marketing` (per-tenant category copy).
3. **Operators** — create the institution's operator accounts; assign roles (vendor, driver,
   finance, admin) so RBAC scopes them to the tenant.
4. **Service catalogue** — load products/menus only after vendor profiles exist.

## Phase 3 — Validate isolation

Run the verification script against the new tenant:

```bash
./scripts/verify-tenant.sh <tenant-id> https://twenzetusokoni.com
```

It checks: tenant is ACTIVE and not default; health reachable; the tenant resolves via the
`x-tenant-id` header; unauthenticated tenant-scoped calls are rejected; RLS policies exist on
the marketplace tables; and the audit-log endpoint responds for the tenant.

Expected result: **all checks pass**. If the RLS or resolution checks fail, stop and escalate —
do not proceed to cutover.

## Phase 4 — Cutover

1. **API clients / apps** — point the institution's app/builds at the API with
   `x-tenant-id: <tenant-id>` on every request (the web client already sends this header from
   `localStorage('tenantId')`).
2. **Domains** — the platform is single-domain today (header-based tenancy). Subdomain tenancy
   is not implemented (`HeaderTenantResolver` only); record subdomain as a roadmap item if the
   institution requires a branded domain.
3. **Notifications** — configure SMS/notification channels that are already tenant-scoped.

## Phase 5 — Go-live verification

1. Health: `curl -sk https://twenzetusokoni.com/api/health` → `200`.
2. Tenant reachable: `curl -sk -H "x-tenant-id: <id>" https://twenzetusokoni.com/api/public/vendors`.
3. A real end-to-end order (place → pay → deliver) executed under the tenant by the operator.
4. Confirm delivery distance/ETA populated (`deliveries.estimated_time_minutes` not null) and
   the delivery SLA report shows the tenant's rows in the admin console.
5. Confirm no cross-tenant leakage: the default tenant's admin console shows none of the new
   tenant's orders.

## Phase 6 — Monitor

- Watch `monitor.sh` output, deploy log, and the daily backup log for the first week.
- Confirm the new tenant appears in the daily backup row-count comparison on the next run of
  `verify-backup-restore.sh`.

## Rollback

Before cutover, rollback = delete the provisioning rows for the tenant. After cutover, rollback
means suspending the tenant: set `status = 'SUSPENDED'` (tenant-scoped requests then fail
closed) and, if required, revoke operator sessions. Data deletion follows the retention
schedule and any contractual terms; never delete a tenant row that has dependent data without a
written instruction.

## Checklist summary

- [ ] Contract + DPA signed and recorded
- [ ] Tenant row created (ACTIVE, not default), id captured
- [ ] Country config confirmed
- [ ] Operators provisioned with correct RBAC roles
- [ ] `verify-tenant.sh` passes all checks
- [ ] API clients send `x-tenant-id`
- [ ] End-to-end order completed under the tenant
- [ ] No cross-tenant leakage observed
- [ ] Monitored for one week after go-live

## See also

- [Enterprise readiness baseline](enterprise-readiness.md)
- [Roadmap](../roadmap.md)