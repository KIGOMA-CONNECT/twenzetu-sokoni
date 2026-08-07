import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Supports the registration/verification feature:
 *
 * 1. `tenants.is_default` — lets the web app resolve the default tenant
 *    server-side instead of hardcoding a tenant UUID on the client.
 * 2. Real-info fields on `users` (business name, NIN/business-registration
 *    number, city) collected from vendors and drivers at registration.
 * 3. AI verification fields (risk score, document status, rejection reason,
 *    verified-at) driving the admin approval workflow.
 *
 * Additive-only: no columns are dropped or type-changed.
 */
export class IdentityVerificationAndDefaultTenant1700000000024 implements MigrationInterface {
  name = 'IdentityVerificationAndDefaultTenant1700000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── tenants: default flag ─────────────────────────────────────
    await queryRunner.query(`ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "is_default" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_tenants_is_default_status" ON "tenants" ("is_default", "status")`);

    // Backfill: mark the first active tenant as the default so existing
    // deployments keep working without a reseed.
    await queryRunner.query(`
      UPDATE "tenants" SET "is_default" = true
      WHERE "id" = (
        SELECT "id" FROM "tenants" WHERE "status" = 'ACTIVE' ORDER BY "created_at" ASC LIMIT 1
      )
    `);

    // ── users: real-info + AI verification columns ────────────────
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "business_name" character varying(150)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nin_or_reg_no" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "city" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_risk_score" smallint`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_document_status" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rejection_reason" character varying(500)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMPTZ`);

    // Admin "pending verification" queue.
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_verification_status" ON "users" ("status", "role")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_verification_status"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "verified_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "rejection_reason"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "verification_document_status"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "verification_risk_score"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "city"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "nin_or_reg_no"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "business_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tenants_is_default_status"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "is_default"`);
  }
}
