import { MigrationInterface, QueryRunner } from 'typeorm';
import { enableRowLevelSecurity } from './support/rls-helper';

export class ReconcileSchema1700000000006 implements MigrationInterface {
  name = 'ReconcileSchema1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Coupons table (CouponOrmEntity)
    await queryRunner.query(`
      CREATE TABLE "coupons" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "code" VARCHAR(50) NOT NULL,
        "discount_type" VARCHAR(20) NOT NULL,
        "discount_value" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS',
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "usage_count" INTEGER NOT NULL DEFAULT 0,
        "min_order_amount" DECIMAL(12,2),
        "max_usage_count" INTEGER,
        "max_usage_per_user" INTEGER,
        "expires_at" TIMESTAMPTZ,
        "description" TEXT,
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_coupons_code_tenant" ON "coupons" ("code", "tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_coupons_status" ON "coupons" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_coupons_tenant_id" ON "coupons" ("tenant_id")`);

    // Flash sales table (FlashSaleOrmEntity)
    await queryRunner.query(`
      CREATE TABLE "flash_sales" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "product_id" UUID NOT NULL,
        "discount_percent" DECIMAL(5,2) NOT NULL,
        "original_price" DECIMAL(12,2) NOT NULL,
        "sale_price" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS',
        "status" VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
        "total_quantity" INTEGER NOT NULL,
        "sold_quantity" INTEGER NOT NULL DEFAULT 0,
        "starts_at" TIMESTAMPTZ NOT NULL,
        "ends_at" TIMESTAMPTZ NOT NULL,
        "description" TEXT,
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_flash_sales_product_id" ON "flash_sales" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_flash_sales_status" ON "flash_sales" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_flash_sales_tenant_id" ON "flash_sales" ("tenant_id")`);

    // Align vehicles table with VehicleOrmEntity
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "vehicle_type" VARCHAR(20)`);
    await queryRunner.query(`ALTER TABLE "vehicles" ALTER COLUMN "vehicle_type" SET NOT NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vehicles_vehicle_type" ON "vehicles" ("vehicle_type")`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "capacity_kg" DECIMAL(8,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "is_available" BOOLEAN NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "is_online" BOOLEAN NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "license_photo_url" TEXT`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "insurance_photo_url" TEXT`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "current_latitude" DECIMAL(10,7)`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "current_longitude" DECIMAL(10,7)`);
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_vehicles_driver_id" ON "vehicles" ("driver_id")`);

    // Reviews: add generic target columns used by driver stats / ratings queries
    await queryRunner.query(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "target_id" UUID`);
    await queryRunner.query(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "target_type" VARCHAR(20)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reviews_target" ON "reviews" ("target_id", "target_type")`);

    // Align partner_kyc table name and columns with PartnerKycOrmEntity
    await queryRunner.query(`ALTER TABLE IF EXISTS "partner_kyc" RENAME TO "partner_kycs"`);
    await queryRunner.query(`ALTER TABLE "partner_kycs" ADD COLUMN IF NOT EXISTS "face_match_score" DECIMAL(5,2)`);
    await queryRunner.query(`ALTER TABLE "partner_kycs" ADD COLUMN IF NOT EXISTS "ocr_extracted_data" JSONB`);
    await queryRunner.query(`ALTER TABLE "partner_kycs" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1`);

    // Row-level security for the new tenant-aware tables
    await enableRowLevelSecurity(queryRunner, 'coupons');
    await enableRowLevelSecurity(queryRunner, 'flash_sales');
    await enableRowLevelSecurity(queryRunner, 'partner_kycs');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "coupons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "flash_sales"`);

    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "vehicle_type"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "capacity_kg"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "is_available"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "is_online"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "verified_at"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "license_photo_url"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "insurance_photo_url"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "current_latitude"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "current_longitude"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "version"`);

    await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN IF EXISTS "target_id"`);
    await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN IF EXISTS "target_type"`);

    await queryRunner.query(`ALTER TABLE "partner_kycs" RENAME TO "partner_kyc"`);
    await queryRunner.query(`ALTER TABLE "partner_kyc" DROP COLUMN IF EXISTS "face_match_score"`);
    await queryRunner.query(`ALTER TABLE "partner_kyc" DROP COLUMN IF EXISTS "ocr_extracted_data"`);
    await queryRunner.query(`ALTER TABLE "partner_kyc" DROP COLUMN IF EXISTS "version"`);
  }
}
