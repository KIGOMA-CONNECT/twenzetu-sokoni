import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUssdSessions1700000000002 implements MigrationInterface {
  name = 'AddUssdSessions1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ussd_sessions" (
        "session_id" VARCHAR(100) NOT NULL,
        "phone_number" VARCHAR(15) NOT NULL,
        "tenant_id" UUID NOT NULL,
        "user_id" VARCHAR(100),
        "user_role" VARCHAR(20),
        "current_menu" VARCHAR(50) DEFAULT 'main',
        "data" JSONB DEFAULT '{}',
        "cart" JSONB DEFAULT '[]',
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "last_accessed_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY ("session_id", "phone_number")
      );
      CREATE INDEX IF NOT EXISTS "IDX_ussd_sessions_phone" ON "ussd_sessions" ("phone_number");
      CREATE INDEX IF NOT EXISTS "IDX_ussd_sessions_tenant" ON "ussd_sessions" ("tenant_id");
      CREATE INDEX IF NOT EXISTS "IDX_ussd_sessions_last_accessed" ON "ussd_sessions" ("last_accessed_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ussd_sessions"`);
  }
}
