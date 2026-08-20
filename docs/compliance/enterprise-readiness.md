# Enterprise Readiness Baseline (L5)

Status: **baseline established** · Review date: 2026-08-19 · Owner: Platform

This document is the living baseline for the **Enterprise Certification (L5)** milestone:

- audit trail completeness review
- backup / disaster-recovery posture (runbooks + verification)
- compliance review against the Tanzanian data-protection regime (2018 EPOCA data-protection regulations and the Personal Data Protection Act, 2022 — "PECA 2018/2022" in this roadmap)
- institutional-tenant onboarding runbook

Open gaps are tracked in each section and in the [roadmap](../roadmap.md). The intent is not
perfection on day one; it is an honest, evidence-based inventory that grows with each milestone.

---

## 1. Audit trail completeness review

### 1.1 Infrastructure (implemented)

| Component | Location | Status |
| --- | --- | --- |
| `audit_logs` table (uuid pk, action, actor_id, actor_role, tenant_id, target_type, target_id, metadata, ip_address; later enhanced with user_id, entity, entity_id, old_data, new_data, user_agent, status, error_message, immutable) | `libs/database/src/lib/migrations/1700000000004-AddAuditLogsTable.ts`, `1700000000027-EnhanceAuditLogs.ts` | Live |
| Async audit queue (BullMQ `audit` queue, `write-audit` job, retry x3 with backoff, writes `immutable = true`) | `libs/core-queue/src/lib/processors/audit.processor.ts`, `libs/core-queue/src/lib/queue.service.ts` | Wired; **no production enqueues today** |
| Sync audit service (`AuditService` with `log` / `logSync` / `query`) | `libs/core-audit/src/lib/audit.service.ts` | Wired into the app module; **no call sites today** |
| Admin audit service + read API (`GET /admin/audit-logs`, `manage_admins`) | `libs/marketplace/api/src/lib/audit-log.service.ts`, `admin.controller.ts` | Live (only production writer) |

### 1.2 Coverage matrix (current)

| Functional area | Audited? | Evidence / notes |
| --- | --- | --- |
| Admin KYC verify/reject | **Yes** | `admin.controller.ts` (`kyc.approved` / `kyc.rejected`) |
| Admin vendor approve / suspend | **Yes** (new) | `vendor.approved` / `vendor.suspended` in `admin.controller.ts` |
| Auth: login / logout / OTP / password / deactivation | No | `libs/identity` has no audit calls |
| Order lifecycle (create / cancel / status) | No | use-cases in `libs/marketplace/application/.../order/` |
| Delivery lifecycle (create / assign / complete / fail) | No | use-cases in `libs/marketplace/application/.../delivery/` |
| Payments / settlements / payouts | Partial | `commission_logs`, `wallet_transactions`, `wallet_withdrawals` record financial effects; no `audit_logs` entry |
| KYC submission | No | `submit-kyc` use case |
| Tenant creation / onboarding | No | `POST /auth/register-tenant` is unaudited |

### 1.3 Remediation plan (prioritised)

| Priority | Item | Suggested hook |
| --- | --- | --- |
| P1 | Record tenant creation + onboarding lifecycle | `Tenant.create()` + register-tenant controller |
| P1 | Record auth events (login, logout, OTP verify, password change/reset, deactivation) | `auth.service.ts` |
| P2 | Record order create / cancel / status transitions | order use-cases (domain-event hook exists on `Order` aggregate) |
| P2 | Record delivery create / assign / complete / fail | delivery use-cases (domain-event hook exists on `Delivery` aggregate) |
| P3 | Record settlement runs + payouts in `audit_logs` | `PayoutSettlementService` |
| P3 | Backfill `old_data` / `new_data` capture via a generic entity-change interceptor | TypeORM subscriber |

Suggested pattern: prefer the async `AuditService` (queue, retries, `immutable = true`) for
non-critical events; keep the sync `AuditLogService` for high-value admin decisions where the
caller expects the record to exist immediately after the response.

---

## 2. Backup & disaster recovery

### 2.1 Current posture (verified on the production host 2026-08-19)

| Item | Value | Evidence |
| --- | --- | --- |
| Daily full backups | **Yes** — cron `30 2 * * *` runs `scripts/backup-db-prod.sh` | `/opt/afri-market/backups/` contains daily `afri_market_YYYYMMDD_HHMMSS.sql.gz` since 2026-08-01 |
| Backup format | `pg_dump --format=custom` (piped to gzip) | `scripts/backup-db-prod.sh` |
| Retention | 30 days, rotated by `find -mtime +30 -delete` | same script |
| Off-site copies | Optional via rclone to S3 (`afrimarket-s3:`) and Google Drive (`gdrive:`) | `.env.production` `BACKUP_S3_BUCKET`, `BACKUP_GDRIVE_FOLDER`; rclone config lives server-side |
| Database container | `postgres:16-alpine`, named volume `afri-market-postgres-data`, not exposed on host | `docker-compose.prod.yml` |
| Redis | AOF enabled (`--appendonly yes`), named volume `afri-market-redis-data` | `docker-compose.prod.yml` |
| Schema migrations | Auto-run on every deploy via `migration:run:prod` (table `migrations`) | `deploy.sh` |
| Deploy | `git push` → cron (`*/2`) auto-deploys → health gate → rollback by redeploying previous commit | `/opt/afri-market/backups/deploy.log` shows `deploy finished (exit 0)` |
| Monitoring | `monitor.sh` cron (`*/10`) + `/api/health`, `/api/metrics` | cron table + `app.module.ts` whitelist |

### 2.2 Runbooks

**Backup (automated):** no action needed. Manual trigger: `./scripts/backup-db-prod.sh`.

**Restore / DR drill (safe, non-destructive):**

```bash
./scripts/verify-backup-restore.sh
```

This restores the latest backup into a throwaway database inside the postgres container,
compares migration counts and key table row counts against the live DB, then drops the
throwaway database. Exit code `0` means the backup is restorable and consistent.

**Full restore (disaster, live DB replacement):**

1. Stop the API: `docker compose -f docker-compose.prod.yml stop api`
2. Restore: `gunzip -c backups/afri_market_<ts>.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres pg_restore -U postgres -d afri_market --no-owner --no-acl --clean --if-exists`
3. Start the API: `docker compose -f docker-compose.prod.yml start api`
4. Verify: health `200`, migration count matches the backup, spot-check a tenant via `verify-tenant.sh`.
5. Restore Redis: replay is unnecessary for business data (Redis holds queues/sessions); flush and let BullMQ re-queue, or accept session loss.

### 2.3 Open gaps

- No automated S3 off-site upload configured yet (Google Drive off-site copy IS verified working).
- No scheduled DR drill; the `verify-backup-restore.sh` script is the first step toward one.
- No RPO/RTO target documented. Recommended: RPO ≤ 24h (daily dump), RTO ≤ 1h (custom-format restore is fast at this scale).
- **Resilience note (fixed 2026-08-20):** after a ~9h silent outage, the stack now self-heals
  (`scripts/monitor.sh` restarts the stack and emails on recovery), alerting was fixed, and the
  monitor/auto-deploy/backup crons were restored. See [performance audit](../performance-audit.md) §9.

---

## 3. Compliance review — Tanzania data protection (PECA 2018/2022)

Scope note: "PECA 2018/2022" refers to the Tanzanian data-protection regime relevant to the
platform: the 2018 data-protection regulations made under the Electronic and Postal
Communications Act (EPOCA), and the **Personal Data Protection Act, 2022** (PDPA 2022).
This checklist is a working baseline, not legal advice.

### 3.1 Checklist

| # | Requirement | Status | Evidence / gap |
| --- | --- | --- | --- |
| 1 | Lawful basis & consent capture | **Gap** | Consent is not recorded per data subject; OTP/registration implied consent only |
| 2 | Purpose limitation | Partial | Constitution 7.x ("collect only what we need"); no per-purpose processing record |
| 3 | Data minimisation | Partial | Verification risk scores, NIN/business-reg numbers collected at registration/KYC; no review of necessity |
| 4 | Accuracy / rectification | Partial | Profile edit exists; no data-accuracy review workflow |
| 5 | Storage limitation / retention | Partial | Backups retained 30 days; **no data-lifecycle/retention schedule for personal data** |
| 6 | Security of processing | **Implemented** | TLS 1.2/1.3 + HSTS/CSP, non-root containers, secrets in `.env.production` (gitignored), dependency security overrides (ADR-0002). Note: **RLS policies exist but are disabled** (verified 2026-08-20); tenant isolation is app-layer `tenant_id` filtering — track as a decision (see [performance audit](../performance-audit.md) §2). |
| 7 | Data-subject rights — access | Gap | No DSAR endpoint/process |
| 8 | Data-subject rights — erasure | Gap | No erasure/deletion endpoint or anonymisation job |
| 9 | Data-subject rights — portability | Gap | No data-export endpoint (CSV exports are analytics only) |
| 10 | Data-subject rights — objection | Gap | No opt-out mechanism beyond account deactivation |
| 11 | Breach notification | Gap | No breach runbook; incident detection is manual via logs/monitoring |
| 12 | Cross-border transfer | Partial | Single-region DB today; no documented transfer safeguards for any future off-site backup |
| 13 | DPO / regulator registration | Gap | No PDPC registration reference; no named DPO |
| 14 | DPIA / risk assessment | Gap | No documented privacy impact assessment |
| 15 | Contracts (DPA) with tenants | Gap | No tenant DPA template; institutional onboarding must require one |
| 16 | Privacy policy / terms of service | **Gap (promised)** | Constitution 8.5 commits to publishing; documents not yet in repo |
| 17 | Accountability / record of processing | Partial | Audit trail infrastructure exists; coverage expanding (section 1) |
| 18 | Children's data | Gap | No age-gating or parental-consent flow |
| 19 | Staff confidentiality / access control | Partial | RBAC + roles exist; no signed confidentiality commitment artifact |
| 20 | Cookie/consent management (web) | Gap | No consent banner or cookie policy on the storefront |

### 3.2 Actions

- Create privacy policy + terms of service documents (P1, blocks institutional onboarding).
- Add a tenant DPA template and require its acceptance in the onboarding runbook (P1).
- Implement data-subject tooling: erasure, export, and consent record (P2).
- Document a retention schedule and a breach-notification runbook (P2).

---

## 4. Related documents

- [Institutional tenant onboarding runbook](institutional-tenant-onboarding.md)
- [Metric catalog](../analytics/metric-catalog.md)
- [Roadmap](../roadmap.md)
- [Constitution — governance principles](../constitution/08-governance-principles.md)