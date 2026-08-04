import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Wallet withdrawal requests: vendor/driver cash-out to mobile money.
 * Mirrors wallet_topup_requests (raw-SQL accessed, no ORM entity).
 */
export class CreateWalletWithdrawals1700000000020 implements MigrationInterface {
  public name = 'CreateWalletWithdrawals1700000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wallet_withdrawals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "amount" DECIMAL(12,2) NOT NULL,
        "phone_number" VARCHAR(20) NOT NULL,
        "provider" VARCHAR(20) NOT NULL DEFAULT 'mpesa',
        "reference" VARCHAR(100),
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "message" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wallet_withdrawals_user" ON "wallet_withdrawals" ("tenant_id", "user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wallet_withdrawals_status" ON "wallet_withdrawals" ("tenant_id", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "wallet_withdrawals"`);
  }
}
