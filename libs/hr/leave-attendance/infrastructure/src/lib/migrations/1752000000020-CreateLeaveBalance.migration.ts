import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeaveBalance1752000000020 implements MigrationInterface {
  public name = 'CreateLeaveBalance1752000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "leave_balance" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "leave_type_id" uuid NOT NULL,
        "year" integer NOT NULL,
        "allocated_days" numeric(5,1) NOT NULL,
        "used_days" numeric(5,1) NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_balance" PRIMARY KEY ("id"),
        CONSTRAINT "FK_leave_balance_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_leave_balance_leave_type" FOREIGN KEY ("leave_type_id") REFERENCES "leave_type" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_leave_balance_tenant_employee_type_year" ON "leave_balance" ("tenant_id", "employee_id", "leave_type_id", "year")
    `);
    await enableRowLevelSecurity(queryRunner, 'leave_balance');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'leave_balance');
    await queryRunner.query(`DROP TABLE "leave_balance"`);
  }
}
