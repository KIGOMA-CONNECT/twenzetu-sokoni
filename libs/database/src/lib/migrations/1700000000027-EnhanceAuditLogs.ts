import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceAuditLogs1700000000027 implements MigrationInterface {
  name = 'EnhanceAuditLogs1700000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing columns to audit_logs table
    await queryRunner.query(`
      ALTER TABLE "audit_logs" 
      ADD COLUMN IF NOT EXISTS "user_id" uuid,
      ADD COLUMN IF NOT EXISTS "entity" character varying(100),
      ADD COLUMN IF NOT EXISTS "entity_id" uuid,
      ADD COLUMN IF NOT EXISTS "old_data" jsonb,
      ADD COLUMN IF NOT EXISTS "new_data" jsonb,
      ADD COLUMN IF NOT EXISTS "user_agent" character varying(500),
      ADD COLUMN IF NOT EXISTS "status" character varying(50) DEFAULT 'success',
      ADD COLUMN IF NOT EXISTS "error_message" text,
      ADD COLUMN IF NOT EXISTS "immutable" boolean DEFAULT false
    `);

    // Add indexes for new columns
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_entity" ON "audit_logs" ("entity", "entity_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_action" ON "audit_logs" ("action")`);

    // Create index for immutable records (for compliance queries)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_immutable" ON "audit_logs" ("immutable") WHERE "immutable" = true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_immutable"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_entity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_user_id"`);
    await queryRunner.query(`
      ALTER TABLE "audit_logs" 
      DROP COLUMN IF EXISTS "immutable",
      DROP COLUMN IF EXISTS "error_message",
      DROP COLUMN IF EXISTS "status",
      DROP COLUMN IF EXISTS "user_agent",
      DROP COLUMN IF EXISTS "new_data",
      DROP COLUMN IF EXISTS "old_data",
      DROP COLUMN IF EXISTS "entity_id",
      DROP COLUMN IF EXISTS "entity",
      DROP COLUMN IF EXISTS "user_id"
    `);
  }
}
