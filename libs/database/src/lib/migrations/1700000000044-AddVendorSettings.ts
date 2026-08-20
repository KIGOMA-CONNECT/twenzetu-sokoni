import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds an extensible `settings` JSONB column to `vendors` so shop owners can
// store business/bank/payout details and a logo URL without further schema
// churn. Everything is stored under namespaced keys for forward compatibility.
export class AddVendorSettings1700000000044 implements MigrationInterface {
  name = 'AddVendorSettings1700000000044';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vendors"
      ADD COLUMN IF NOT EXISTS "settings" jsonb NOT NULL DEFAULT '{}'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vendors" DROP COLUMN IF EXISTS "settings"`);
  }
}