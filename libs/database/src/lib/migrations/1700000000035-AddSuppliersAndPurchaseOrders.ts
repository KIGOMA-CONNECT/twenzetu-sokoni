import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuppliersAndPurchaseOrders1700000000035 implements MigrationInterface {
  name = 'AddSuppliersAndPurchaseOrders1700000000035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "suppliers" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL REFERENCES "vendors"("id") ON DELETE CASCADE,
        "name" varchar(120) NOT NULL,
        "phone" varchar(30),
        "contact_person" varchar(120),
        "notes" varchar(500),
        "linked_vendor_id" UUID,
        "status" varchar(20) NOT NULL DEFAULT 'ACTIVE',
        "version" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_suppliers_id" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_suppliers_vendor"
        ON "suppliers" ("vendor_id");
      CREATE INDEX IF NOT EXISTS "IDX_suppliers_tenant_vendor"
        ON "suppliers" ("tenant_id", "vendor_id");

      CREATE TABLE IF NOT EXISTS "purchase_orders" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL REFERENCES "vendors"("id") ON DELETE CASCADE,
        "operator_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "supplier_id" UUID,
        "po_number" varchar(64) NOT NULL,
        "items" jsonb NOT NULL DEFAULT '[]',
        "total_cost" decimal(12,2) NOT NULL DEFAULT 0,
        "currency" varchar(10) NOT NULL DEFAULT 'TZS',
        "status" varchar(20) NOT NULL DEFAULT 'ORDERED',
        "payment_status" varchar(10) NOT NULL DEFAULT 'UNPAID',
        "notes" varchar(500),
        "received_at" TIMESTAMP WITH TIME ZONE,
        "confirmed_at" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_purchase_orders_id" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_vendor"
        ON "purchase_orders" ("vendor_id");
      CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_tenant_vendor"
        ON "purchase_orders" ("tenant_id", "vendor_id");
      CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_tenant_vendor_created"
        ON "purchase_orders" ("tenant_id", "vendor_id", "created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "purchase_orders";
      DROP TABLE IF EXISTS "suppliers";
    `);
  }
}