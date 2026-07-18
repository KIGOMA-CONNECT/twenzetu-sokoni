import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayrollPeriod1752000000024 implements MigrationInterface {
  public name = 'CreatePayrollPeriod1752000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "payroll_period" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "year" integer NOT NULL,
        "month" integer NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'OPEN',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payroll_period" PRIMARY KEY ("id"),
        CONSTRAINT "CK_payroll_period_status" CHECK ("status" IN ('OPEN', 'CLOSED')),
        CONSTRAINT "CK_payroll_period_month" CHECK ("month" BETWEEN 1 AND 12)
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_payroll_period_tenant_year_month" ON "payroll_period" ("tenant_id", "year", "month")
    `);
    await enableRowLevelSecurity(queryRunner, 'payroll_period');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'payroll_period');
    await queryRunner.query(`DROP TABLE "payroll_period"`);
  }
}
