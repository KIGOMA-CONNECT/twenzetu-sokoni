import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Server-side cart: one active cart per (tenant, user, vendor). Prices and
 * product names are snapshotted at add-time but re-validated against the
 * products table at checkout.
 */
export class CreateServerCarts1700000000019 implements MigrationInterface {
  public name = 'CreateServerCarts1700000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "vendor_id" uuid NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS',
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_carts_user_vendor" ON "carts" ("tenant_id", "user_id", "vendor_id")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_carts_active_user_vendor" ON "carts" ("tenant_id", "user_id", "vendor_id") WHERE "status" = 'ACTIVE'`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cart_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "cart_id" uuid NOT NULL REFERENCES "carts" ("id") ON DELETE CASCADE,
        "product_id" uuid NOT NULL,
        "product_name" VARCHAR(200) NOT NULL,
        "quantity" INTEGER NOT NULL,
        "unit_price" DECIMAL(12,2) NOT NULL,
        "total_price" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cart_items_cart" ON "cart_items" ("tenant_id", "cart_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cart_items_product" ON "cart_items" ("tenant_id", "product_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cart_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carts"`);
  }
}
