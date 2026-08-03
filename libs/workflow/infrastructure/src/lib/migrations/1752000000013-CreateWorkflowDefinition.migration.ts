import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkflowDefinition1752000000013 implements MigrationInterface {
  public name = 'CreateWorkflowDefinition1752000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "workflow_definition" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(64) NOT NULL,
        "name" varchar(160) NOT NULL,
        "steps" jsonb NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workflow_definition" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_workflow_definition_tenant_code" ON "workflow_definition" ("tenant_id", "code")
    `);
    await enableRowLevelSecurity(queryRunner, 'workflow_definition');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'workflow_definition');
    await queryRunner.query(`DROP TABLE "workflow_definition"`);
  }
}
