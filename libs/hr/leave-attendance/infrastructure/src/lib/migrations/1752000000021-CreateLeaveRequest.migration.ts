import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeaveRequest1752000000021 implements MigrationInterface {
  public name = 'CreateLeaveRequest1752000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "leave_request" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "leave_type_id" uuid NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "number_of_days" numeric(5,1) NOT NULL,
        "reason" text,
        "status" varchar(16) NOT NULL DEFAULT 'PENDING',
        "decided_by_user_id" uuid,
        "decided_at" timestamptz,
        "comment" text,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_request" PRIMARY KEY ("id"),
        CONSTRAINT "FK_leave_request_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_leave_request_leave_type" FOREIGN KEY ("leave_type_id") REFERENCES "leave_type" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_leave_request_status" CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_leave_request_tenant_employee" ON "leave_request" ("tenant_id", "employee_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'leave_request');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'leave_request');
    await queryRunner.query(`DROP TABLE "leave_request"`);
  }
}
