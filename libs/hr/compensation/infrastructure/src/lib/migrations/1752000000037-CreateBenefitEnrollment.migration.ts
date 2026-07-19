import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBenefitEnrollment1752000000037 implements MigrationInterface {
  public name = 'CreateBenefitEnrollment1752000000037';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "benefit_enrollment" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "benefit_plan_id" uuid NOT NULL,
        "effective_date" date NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'ACTIVE',
        "cancelled_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_benefit_enrollment" PRIMARY KEY ("id"),
        CONSTRAINT "FK_benefit_enrollment_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_benefit_enrollment_benefit_plan" FOREIGN KEY ("benefit_plan_id") REFERENCES "benefit_plan" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_benefit_enrollment_status" CHECK ("status" IN ('ACTIVE', 'CANCELLED'))
      )
    `);
    // Partial unique index: only one ACTIVE enrollment per employee per plan
    // at a time — mirrors offboarding_case's "one active row" partial
    // unique index pattern (ADR-0013).
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_benefit_enrollment_tenant_employee_plan_active"
      ON "benefit_enrollment" ("tenant_id", "employee_id", "benefit_plan_id")
      WHERE "status" = 'ACTIVE'
    `);
    await enableRowLevelSecurity(queryRunner, 'benefit_enrollment');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'benefit_enrollment');
    await queryRunner.query(`DROP TABLE "benefit_enrollment"`);
  }
}
