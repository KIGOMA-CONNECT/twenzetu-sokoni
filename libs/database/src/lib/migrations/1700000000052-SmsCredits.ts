import { MigrationInterface, QueryRunner } from 'typeorm';

export class SmsCredits1700000000052 implements MigrationInterface {
  name = 'SmsCredits1700000000052';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS "sms_credits" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "vendor_id" uuid NOT NULL,
        "total_credits" INTEGER NOT NULL DEFAULT 0,
        "used_credits" INTEGER NOT NULL DEFAULT 0,
        "available_credits" INTEGER NOT NULL DEFAULT 0,
        "total_spent" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await qr.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sms_credits_tenant_vendor" ON "sms_credits" ("tenant_id", "vendor_id")`,
    );

    await qr.query(`
      CREATE TABLE IF NOT EXISTS "sms_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "vendor_id" uuid NOT NULL,
        "recipient_phone" VARCHAR(20) NOT NULL,
        "recipient_type" VARCHAR(20) NOT NULL,
        "message" TEXT NOT NULL,
        "message_length" INTEGER NOT NULL,
        "credits_used" INTEGER NOT NULL,
        "source" VARCHAR(20) NOT NULL,
        "status" VARCHAR(20) NOT NULL,
        "provider" VARCHAR(30),
        "error_message" TEXT,
        "reference_id" VARCHAR(100),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await qr.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sms_logs_tenant_vendor" ON "sms_logs" ("tenant_id", "vendor_id")`,
    );
    await qr.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sms_logs_tenant_created" ON "sms_logs" ("tenant_id", "created_at")`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS "sms_logs"`);
    await qr.query(`DROP TABLE IF EXISTS "sms_credits"`);
  }
}
