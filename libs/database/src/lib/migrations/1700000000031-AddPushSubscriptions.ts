import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPushSubscriptions1700000000031 implements MigrationInterface {
  name = 'AddPushSubscriptions1700000000031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "push_subscriptions" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "endpoint" TEXT NOT NULL,
        "p256dh" TEXT NOT NULL,
        "auth" TEXT NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_push_subscriptions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_push_subscriptions_user_endpoint" UNIQUE ("user_id", "endpoint")
      );
      CREATE INDEX IF NOT EXISTS "IDX_push_subscriptions_user"
        ON "push_subscriptions" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "push_subscriptions"`);
  }
}
