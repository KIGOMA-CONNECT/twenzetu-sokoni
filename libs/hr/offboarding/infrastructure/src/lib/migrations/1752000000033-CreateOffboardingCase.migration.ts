import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOffboardingCase1752000000033 implements MigrationInterface {
  public name = 'CreateOffboardingCase1752000000033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "offboarding_case" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "exit_reason" varchar(24) NOT NULL,
        "last_working_day" date NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'INITIATED',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_offboarding_case" PRIMARY KEY ("id"),
        CONSTRAINT "FK_offboarding_case_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_offboarding_case_exit_reason" CHECK ("exit_reason" IN ('RESIGNATION', 'TERMINATION', 'RETIREMENT', 'END_OF_CONTRACT', 'OTHER')),
        CONSTRAINT "CK_offboarding_case_status" CHECK ("status" IN ('INITIATED', 'COMPLETED', 'CANCELLED'))
      )
    `);
    // Partial unique index: only one INITIATED (in-flight) case per employee
    // at a time — mirrors salary_structure's "one active row" partial unique
    // index pattern (ADR-0010). Completed/cancelled cases stay as history.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_offboarding_case_tenant_employee_active"
      ON "offboarding_case" ("tenant_id", "employee_id")
      WHERE "status" = 'INITIATED'
    `);
    await enableRowLevelSecurity(queryRunner, 'offboarding_case');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'offboarding_case');
    await queryRunner.query(`DROP TABLE "offboarding_case"`);
  }
}
