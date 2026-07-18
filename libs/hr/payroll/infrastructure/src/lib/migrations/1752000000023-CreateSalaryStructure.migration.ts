import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalaryStructure1752000000023 implements MigrationInterface {
  public name = 'CreateSalaryStructure1752000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "salary_structure" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "basic_salary" numeric(18,4) NOT NULL,
        "currency" varchar(3) NOT NULL,
        "allowances" jsonb NOT NULL DEFAULT '[]',
        "effective_from" date NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_salary_structure" PRIMARY KEY ("id"),
        CONSTRAINT "FK_salary_structure_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT
      )
    `);
    // Partial unique index — a DB-level backstop for "one active structure per
    // employee" (the command handler also checks, but a race between two
    // concurrent SetSalaryStructure calls should fail loudly, not silently
    // leave two active rows).
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_salary_structure_tenant_employee_active" ON "salary_structure" ("tenant_id", "employee_id") WHERE "is_active" = true
    `);
    await enableRowLevelSecurity(queryRunner, 'salary_structure');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'salary_structure');
    await queryRunner.query(`DROP TABLE "salary_structure"`);
  }
}
