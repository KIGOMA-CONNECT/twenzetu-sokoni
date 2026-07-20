import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployeeComplianceRecord1752000000043 implements MigrationInterface {
  public name = 'CreateEmployeeComplianceRecord1752000000043';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "employee_compliance_record" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "compliance_requirement_id" uuid NOT NULL,
        "due_date" date NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'PENDING',
        "completed_date" date,
        "exemption_reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee_compliance_record" PRIMARY KEY ("id"),
        CONSTRAINT "FK_employee_compliance_record_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_employee_compliance_record_requirement" FOREIGN KEY ("compliance_requirement_id") REFERENCES "compliance_requirement" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_employee_compliance_record_status" CHECK ("status" IN ('PENDING', 'COMPLIANT', 'OVERDUE', 'EXEMPT'))
      )
    `);
    // Partial unique index: only one PENDING record per employee per
    // requirement at a time — mirrors course_enrollment's "one active
    // enrollment per employee per course" pattern (ADR-0015). A new
    // assignment cycle is created only after the current one reaches a
    // terminal status (COMPLIANT/OVERDUE/EXEMPT).
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_employee_compliance_record_tenant_employee_requirement_pending"
      ON "employee_compliance_record" ("tenant_id", "employee_id", "compliance_requirement_id")
      WHERE "status" = 'PENDING'
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_employee_compliance_record_tenant_employee" ON "employee_compliance_record" ("tenant_id", "employee_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'employee_compliance_record');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'employee_compliance_record');
    await queryRunner.query(`DROP TABLE "employee_compliance_record"`);
  }
}
