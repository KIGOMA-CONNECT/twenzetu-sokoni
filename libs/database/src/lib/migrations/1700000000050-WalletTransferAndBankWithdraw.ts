import { MigrationInterface, QueryRunner } from 'typeorm';

export class WalletTransferAndBankWithdraw1700000000050 implements MigrationInterface {
  name = 'WalletTransferAndBankWithdraw1700000000050';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS "wallet_transfers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "sender_type" VARCHAR(20) NOT NULL,
        "recipient_id" uuid NOT NULL,
        "recipient_type" VARCHAR(20) NOT NULL,
        "amount" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS',
        "description" TEXT,
        "reference" VARCHAR(100) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await qr.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wallet_transfers_sender" ON "wallet_transfers" ("tenant_id", "sender_id")`,
    );
    await qr.query(
      `CREATE INDEX IF NOT EXISTS "IDX_wallet_transfers_recipient" ON "wallet_transfers" ("tenant_id", "recipient_id")`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS "wallet_transfers"`);
  }
}
