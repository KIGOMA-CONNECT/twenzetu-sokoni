import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fixes ORM-vs-schema drift and adds the indexes that power the highest-
 * traffic queries (auto-dispatch, OTP cleanup, payment timeout, loan
 * reminders, driver pickup, wallet/surge lookups).
 *
 * Additive-only: no columns are dropped or type-changed.
 */
export class ReconcilePerformanceSchema1700000000023 implements MigrationInterface {
  name = 'ReconcilePerformanceSchema1700000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── payments: add columns the entity maps but no migration created ──
    // PaymentOrmEntity expects initiated_at/confirmed_at; findPendingOlderThan
    // (payment-timeout scheduler) filters on initiated_at and would throw
    // "column initiated_at does not exist" on every run.
    await queryRunner.query(`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "initiated_at" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMPTZ`);

    // Webhook hot path: findByTransactionRef on every M-Pesa/AzamPay callback.
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payments_transaction_ref" ON "payments" ("transaction_ref")`);
    // Payment timeout: WHERE status='PENDING' AND initiated_at < cutoff.
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payments_status_initiated" ON "payments" ("status", "initiated_at")`);
    // Admin/vendor payment lists.
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payments_tenant_status" ON "payments" ("tenant_id", "status")`);

    // ── orders: composite index for auto-dispatch + stale-order scans ──
    // auto-dispatch runs every minute: WHERE status IN (...) AND created_at <= NOW()-15min.
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_status_created" ON "orders" ("status", "created_at")`);

    // ── otps: cleanup job deletes WHERE created_at < cutoff (no index today) ──
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_otps_created_at" ON "otps" ("created_at")`);

    // ── micro_loans: loan-reminder scans WHERE status='ACTIVE' AND due_at < now ──
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_micro_loans_status_due" ON "micro_loans" ("status", "due_at")`);

    // ── vehicles: auto-dispatch pickDriver filters (tenant_id, is_online, is_available) ──
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vehicles_tenant_online_avail" ON "vehicles" ("tenant_id", "is_online", "is_available")`);

    // ── surge_rules: surge-recalc scans is_active ──
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_surge_rules_is_active" ON "surge_rules" ("is_active")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_surge_rules_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vehicles_tenant_online_avail"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_micro_loans_status_due"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_otps_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_status_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tenant_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_status_initiated"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_transaction_ref"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN IF EXISTS "confirmed_at"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN IF EXISTS "initiated_at"`);
  }
}
