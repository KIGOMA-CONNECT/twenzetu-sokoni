import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixNotificationsBodyColumn1700000000053 implements MigrationInterface {
  name = 'FixNotificationsBodyColumn1700000000053';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "body" TEXT`);
    await qr.query(`UPDATE "notifications" SET "body" = "message" WHERE "body" IS NULL AND "message" IS NOT NULL`);
    // Ensure ABMS columns exist if manual hotfix was not applied
    await qr.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "channel" VARCHAR(20) NOT NULL DEFAULT 'IN_APP'`);
    await qr.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL'`);
    await qr.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING'`);
    await qr.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "data" JSONB NOT NULL DEFAULT '{}'`);
    await qr.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "template_id" UUID`);
    await qr.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "template_variables" JSONB NOT NULL DEFAULT '{}'`);
    await qr.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "sent_at" TIMESTAMPTZ`);
    await qr.query(`ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMPTZ`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    // Keep body for marketplace compatibility; only drop ABMS-added columns if needed
    await qr.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "read_at"`);
    await qr.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "sent_at"`);
    await qr.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "template_variables"`);
    await qr.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "template_id"`);
  }
}
