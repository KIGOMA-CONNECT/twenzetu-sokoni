import { MigrationInterface, QueryRunner } from 'typeorm';

// SavingsAccountEntity maps a `frozen_balance` column, but migration
// 1700000000029 created `savings_accounts` without it (it only added
// `frozen_balance` to `wallets`). Any SELECT on the savings repo therefore
// fails with "column savings_accounts.frozen_balance does not exist".
//
// Safe in both cases: if 0029 already created the table we just add the
// column; if it never ran (or failed) we create the table with the column.
export class AddSavingsFrozenBalance1700000000036 implements MigrationInterface {
  name = 'AddSavingsFrozenBalance1700000000036';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "savings_accounts" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "owner_id" UUID NOT NULL,
        "owner_type" VARCHAR(20) NOT NULL CHECK (owner_type IN ('customer', 'vendor', 'driver')),
        "balance" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "frozen_balance" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'TZS',
        "interest_rate" NUMERIC(5,4) NOT NULL DEFAULT 0.05,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      ALTER TABLE "savings_accounts"
      ADD COLUMN IF NOT EXISTS "frozen_balance" NUMERIC(14,2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_savings_owner" ON "savings_accounts" ("owner_id", "owner_type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "savings_accounts" DROP COLUMN IF EXISTS "frozen_balance"
    `);
  }
}
