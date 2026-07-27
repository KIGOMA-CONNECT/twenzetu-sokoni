import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPermissionsAndNotifications1700000000003 implements MigrationInterface {
  name = 'AddPermissionsAndNotifications1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "permissions" TEXT
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "title" VARCHAR(200) NOT NULL,
        "message" TEXT NOT NULL,
        "type" VARCHAR(50) NOT NULL,
        "reference_id" UUID,
        "reference_type" VARCHAR(50),
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_notifications_user_read"
        ON "notifications" ("user_id", "is_read");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "permissions"`);
  }
}
