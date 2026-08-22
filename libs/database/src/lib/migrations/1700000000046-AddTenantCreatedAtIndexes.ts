import { MigrationInterface, QueryRunner } from 'typeorm';

// Composite (tenant_id, created_at) indexes for the hottest list/aggregate
// queries: dashboards, recent-order lists and analytics scans all filter by
// tenant and sort/filter by creation date. Without these, Postgres falls back
// to the single-column tenant_id index and then sorts rows in memory.
export class AddTenantCreatedAtIndexes1700000000046 implements MigrationInterface {
  name = 'AddTenantCreatedAtIndexes1700000000046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_orders_tenant_created_at"
      ON "orders" ("tenant_id", "created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_deliveries_tenant_created_at"
      ON "deliveries" ("tenant_id", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_deliveries_tenant_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_orders_tenant_created_at"`);
  }
}
