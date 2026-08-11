import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPosAndProductSku1700000000034 implements MigrationInterface {
  name = 'AddPosAndProductSku1700000000034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" varchar(64);
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "barcode" varchar(128);
      CREATE INDEX IF NOT EXISTS "IDX_products_vendor_sku" ON "products" ("vendor_id", "sku");
      CREATE INDEX IF NOT EXISTS "IDX_products_vendor_barcode" ON "products" ("vendor_id", "barcode");

      CREATE TABLE IF NOT EXISTS "product_sales" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL REFERENCES "vendors"("id") ON DELETE CASCADE,
        "operator_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "sale_number" varchar(64) NOT NULL,
        "subtotal" decimal(12,2) NOT NULL,
        "discount" decimal(12,2) NOT NULL DEFAULT 0,
        "tax" decimal(12,2) NOT NULL DEFAULT 0,
        "total" decimal(12,2) NOT NULL,
        "currency" varchar(10) NOT NULL DEFAULT 'TZS',
        "payment_method" varchar(20) NOT NULL,
        "amount_tendered" decimal(12,2),
        "items" jsonb NOT NULL DEFAULT '[]',
        "status" varchar(20) NOT NULL DEFAULT 'COMPLETED',
        "version" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_product_sales_id" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_product_sales_vendor"
        ON "product_sales" ("vendor_id");
      CREATE INDEX IF NOT EXISTS "IDX_product_sales_tenant_vendor"
        ON "product_sales" ("tenant_id", "vendor_id");
      CREATE INDEX IF NOT EXISTS "IDX_product_sales_tenant_vendor_created"
        ON "product_sales" ("tenant_id", "vendor_id", "created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "product_sales";
      DROP INDEX IF EXISTS "IDX_products_vendor_barcode";
      DROP INDEX IF EXISTS "IDX_products_vendor_sku";
      ALTER TABLE "products" DROP COLUMN IF EXISTS "barcode";
      ALTER TABLE "products" DROP COLUMN IF EXISTS "sku";
    `);
  }
}