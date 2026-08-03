import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayslip1752000000025 implements MigrationInterface {
  public name = 'CreatePayslip1752000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payslip" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "payroll_period_id" uuid NOT NULL,
        "basic_salary" numeric(18,4) NOT NULL,
        "currency" varchar(3) NOT NULL,
        "allowances" jsonb NOT NULL DEFAULT '[]',
        "gross_pay" numeric(18,4) NOT NULL,
        "paye_amount" numeric(18,4) NOT NULL,
        "nssf_employee_amount" numeric(18,4) NOT NULL,
        "nssf_employer_amount" numeric(18,4) NOT NULL,
        "wcf_employer_amount" numeric(18,4) NOT NULL,
        "sdl_employer_amount" numeric(18,4) NOT NULL,
        "net_pay" numeric(18,4) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'DRAFT',
        "approved_by_user_id" uuid,
        "approved_at" timestamptz,
        "paid_by_user_id" uuid,
        "paid_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payslip" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payslip_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_payslip_payroll_period" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_period" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_payslip_status" CHECK ("status" IN ('DRAFT', 'APPROVED', 'PAID'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_payslip_tenant_employee_period" ON "payslip" ("tenant_id", "employee_id", "payroll_period_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'payslip');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'payslip');
    await queryRunner.query(`DROP TABLE "payslip"`);
  }
}
