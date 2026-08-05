import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns production tables with ORM entities for columns that no migration
 * ever created. Additive-only: nothing is dropped or type-changed, so the
 * migration is safe to run against populated production data.
 */
export class ReconcileRuntimeColumns1700000000022 implements MigrationInterface {
  name = 'ReconcileRuntimeColumns1700000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // VendorQuoteOrmEntity expects `version`; migrations created `status` instead.
    await queryRunner.query(`ALTER TABLE "vendor_quotes" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1`);

    // PointsTransactionOrmEntity expects `description` + `order_id`; migrations created `reason`.
    await queryRunner.query(`ALTER TABLE "points_transactions" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "points_transactions" ADD COLUMN IF NOT EXISTS "order_id" UUID`);

    // CashbackRuleOrmEntity expects `source_service` + `target_service`; migrations created `name`/`min_order_amount`.
    await queryRunner.query(`ALTER TABLE "cashback_rules" ADD COLUMN IF NOT EXISTS "source_service" VARCHAR(50) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "cashback_rules" ADD COLUMN IF NOT EXISTS "target_service" VARCHAR(50) NOT NULL DEFAULT ''`);

    // CustomProcurementOrmEntity expects `version`.
    await queryRunner.query(`ALTER TABLE "custom_procurements" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1`);

    // TenantAwareEntity declares `updated_at`; the table was created without it.
    await queryRunner.query(`ALTER TABLE "service_request_messages" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_request_messages" DROP COLUMN IF EXISTS "updated_at"`);
    await queryRunner.query(`ALTER TABLE "custom_procurements" DROP COLUMN IF EXISTS "version"`);
    await queryRunner.query(`ALTER TABLE "cashback_rules" DROP COLUMN IF EXISTS "target_service"`);
    await queryRunner.query(`ALTER TABLE "cashback_rules" DROP COLUMN IF EXISTS "source_service"`);
    await queryRunner.query(`ALTER TABLE "points_transactions" DROP COLUMN IF EXISTS "order_id"`);
    await queryRunner.query(`ALTER TABLE "points_transactions" DROP COLUMN IF EXISTS "description"`);
    await queryRunner.query(`ALTER TABLE "vendor_quotes" DROP COLUMN IF EXISTS "version"`);
  }
}
