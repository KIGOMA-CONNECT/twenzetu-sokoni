import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobRequisition1752000000026 implements MigrationInterface {
  public name = 'CreateJobRequisition1752000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "job_requisition" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "position_id" uuid NOT NULL,
        "title" varchar(160) NOT NULL,
        "headcount" integer NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'OPEN',
        "close_reason" varchar(16),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_job_requisition" PRIMARY KEY ("id"),
        CONSTRAINT "FK_job_requisition_position" FOREIGN KEY ("position_id") REFERENCES "position" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_job_requisition_status" CHECK ("status" IN ('OPEN', 'CLOSED')),
        CONSTRAINT "CK_job_requisition_close_reason" CHECK ("close_reason" IS NULL OR "close_reason" IN ('FILLED', 'CANCELLED'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_job_requisition_tenant" ON "job_requisition" ("tenant_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'job_requisition');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'job_requisition');
    await queryRunner.query(`DROP TABLE "job_requisition"`);
  }
}
