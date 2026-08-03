import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApplication1752000000028 implements MigrationInterface {
  public name = 'CreateApplication1752000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "application" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        "job_requisition_id" uuid NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'APPLIED',
        "decision_notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_application" PRIMARY KEY ("id"),
        CONSTRAINT "FK_application_candidate" FOREIGN KEY ("candidate_id") REFERENCES "candidate" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_application_job_requisition" FOREIGN KEY ("job_requisition_id") REFERENCES "job_requisition" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_application_status" CHECK ("status" IN ('APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_application_tenant_candidate_requisition" ON "application" ("tenant_id", "candidate_id", "job_requisition_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'application');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'application');
    await queryRunner.query(`DROP TABLE "application"`);
  }
}
