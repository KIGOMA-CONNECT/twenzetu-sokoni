import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds an `fcm_token` column to `push_subscriptions` so native (Firebase Cloud
// Messaging) tokens can be stored alongside web-push (VAPID) subscriptions.
// Web-push columns become nullable so an FCM-only subscription can be saved
// without a browser endpoint. The unique index ignores NULLs (Postgres treats
// them as distinct), so web-push rows never collide with FCM rows.
export class AddFcmTokenToPushSubscriptions1700000000042 implements MigrationInterface {
  name = 'AddFcmTokenToPushSubscriptions1700000000042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "push_subscriptions"
      ADD COLUMN IF NOT EXISTS "fcm_token" TEXT
    `);
    await queryRunner.query(`
      ALTER TABLE "push_subscriptions"
      ALTER COLUMN "endpoint" DROP NOT NULL,
      ALTER COLUMN "p256dh" DROP NOT NULL,
      ALTER COLUMN "auth" DROP NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_push_subscriptions_user_fcm_token"
      ON "push_subscriptions" ("user_id", "fcm_token")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_push_subscriptions_user_fcm_token"
    `);
    await queryRunner.query(`
      ALTER TABLE "push_subscriptions"
      ALTER COLUMN "endpoint" SET NOT NULL,
      ALTER COLUMN "p256dh" SET NOT NULL,
      ALTER COLUMN "auth" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "push_subscriptions"
      DROP COLUMN IF EXISTS "fcm_token"
    `);
  }
}