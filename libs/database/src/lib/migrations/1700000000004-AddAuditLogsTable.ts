import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogsTable1700000000004 implements MigrationInterface {
  name = 'AddAuditLogsTable1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "action" character varying(50) NOT NULL,
        "actor_id" uuid NOT NULL,
        "actor_role" character varying(30),
        "tenant_id" uuid,
        "target_type" character varying(50),
        "target_id" uuid,
        "metadata" jsonb,
        "ip_address" character varying(45),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_actor_id" ON "audit_logs" ("actor_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_tenant_created" ON "audit_logs" ("tenant_id", "created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_tenant_created"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_actor_id"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
