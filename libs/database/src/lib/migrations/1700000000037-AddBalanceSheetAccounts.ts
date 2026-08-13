import { MigrationInterface, QueryRunner } from 'typeorm';

// BalanceSheetAccountOrmEntity maps the `balance_sheet_accounts` table used to
// record vendor-managed "other assets" and "other liabilities" on the balance
// sheet (equipment, receivables, supplier payables, taxes, etc.). Built with
// CREATE TABLE IF NOT EXISTS so it is safe on every environment.
export class AddBalanceSheetAccounts1700000000037 implements MigrationInterface {
  name = 'AddBalanceSheetAccounts1700000000037';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "balance_sheet_accounts" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "category" VARCHAR(20) NOT NULL CHECK (category IN ('asset', 'liability')),
        "amount" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'TZS',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_balance_sheet_accounts_vendor"
      ON "balance_sheet_accounts" ("tenant_id", "vendor_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "balance_sheet_accounts"`);
  }
}
