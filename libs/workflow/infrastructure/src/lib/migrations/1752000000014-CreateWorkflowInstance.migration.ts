import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkflowInstance1752000000014 implements MigrationInterface {
  public name = 'CreateWorkflowInstance1752000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "workflow_instance" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "workflow_definition_id" uuid NOT NULL,
        "subject_type" varchar(64) NOT NULL,
        "subject_id" varchar(255) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'PENDING',
        "steps" jsonb NOT NULL,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workflow_instance" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workflow_instance_definition" FOREIGN KEY ("workflow_definition_id") REFERENCES "workflow_definition" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_workflow_instance_status" CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_workflow_instance_tenant_subject" ON "workflow_instance" ("tenant_id", "subject_type", "subject_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'workflow_instance');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'workflow_instance');
    await queryRunner.query(`DROP TABLE "workflow_instance"`);
  }
}
