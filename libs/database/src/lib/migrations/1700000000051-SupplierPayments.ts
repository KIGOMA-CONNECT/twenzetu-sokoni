import { MigrationInterface, QueryRunner } from 'typeorm';

export class SupplierPayments1700000000051 implements MigrationInterface {
  name = 'SupplierPayments1700000000051';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS "supplier_payments" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL,
        "purchase_order_id" UUID,
        "supplier_id" UUID,
        "amount" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS',
        "method" VARCHAR(20) NOT NULL,
        "phone_number" VARCHAR(20),
        "bank_name" VARCHAR(100),
        "bank_account_number" VARCHAR(50),
        "reference" VARCHAR(100) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "description" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_supplier_payments_id" PRIMARY KEY ("id")
      )
    `);
    await qr.query(
      `CREATE INDEX IF NOT EXISTS "IDX_supplier_payments_vendor" ON "supplier_payments" ("tenant_id", "vendor_id")`,
    );
    await qr.query(
      `CREATE INDEX IF NOT EXISTS "IDX_supplier_payments_purchase_order" ON "supplier_payments" ("purchase_order_id")`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS "supplier_payments"`);
  }
}
