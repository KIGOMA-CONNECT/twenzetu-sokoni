import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployee1752000000016 implements MigrationInterface {
  public name = 'CreateEmployee1752000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "employee" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid,
        "employee_number" varchar(32) NOT NULL,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(32),
        "date_of_birth" date,
        "gender" varchar(20),
        "position_id" uuid,
        "org_unit_id" uuid,
        "hire_date" date NOT NULL,
        "employment_type" varchar(16) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'ACTIVE',
        "termination_date" date,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee" PRIMARY KEY ("id"),
        CONSTRAINT "FK_employee_position" FOREIGN KEY ("position_id") REFERENCES "position" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_employee_status" CHECK ("status" IN ('ACTIVE', 'SUSPENDED', 'TERMINATED')),
        CONSTRAINT "CK_employee_employment_type" CHECK ("employment_type" IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_employee_tenant_number" ON "employee" ("tenant_id", "employee_number")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_employee_tenant_email" ON "employee" ("tenant_id", "email")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_employee_tenant_org_unit" ON "employee" ("tenant_id", "org_unit_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'employee');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'employee');
    await queryRunner.query(`DROP TABLE "employee"`);
  }
}
