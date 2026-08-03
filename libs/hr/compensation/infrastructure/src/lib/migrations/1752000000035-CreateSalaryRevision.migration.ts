import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

// See libs/hr/infrastructure's CreateEmploymentHistory migration for the
// same WORM pattern/reasoning: RLS and immutability are independent
// properties and both apply here. See ADR-0014.
const RUNTIME_ROLE = 'abms_runtime';

export class CreateSalaryRevision1752000000035 implements MigrationInterface {
  public name = 'CreateSalaryRevision1752000000035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "salary_revision" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "reason" varchar(32) NOT NULL,
        "previous_basic_salary" numeric(18,4) NOT NULL,
        "new_basic_salary" numeric(18,4) NOT NULL,
        "currency" varchar(3) NOT NULL,
        "effective_date" date NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_salary_revision" PRIMARY KEY ("id"),
        CONSTRAINT "FK_salary_revision_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_salary_revision_reason" CHECK ("reason" IN ('MERIT_INCREASE', 'PROMOTION', 'MARKET_ADJUSTMENT', 'COST_OF_LIVING_ADJUSTMENT', 'DEMOTION', 'OTHER'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_salary_revision_tenant_employee" ON "salary_revision" ("tenant_id", "employee_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'salary_revision');
    await queryRunner.query(`REVOKE UPDATE, DELETE ON "salary_revision" FROM "${RUNTIME_ROLE}"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'salary_revision');
    await queryRunner.query(`DROP TABLE "salary_revision"`);
  }
}
