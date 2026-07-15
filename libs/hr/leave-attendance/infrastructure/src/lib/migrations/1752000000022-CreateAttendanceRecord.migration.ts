import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttendanceRecord1752000000022 implements MigrationInterface {
  public name = 'CreateAttendanceRecord1752000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "attendance_record" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "date" date NOT NULL,
        "clock_in_time" timestamptz,
        "clock_out_time" timestamptz,
        "status" varchar(16) NOT NULL DEFAULT 'PRESENT',
        "hours_worked" numeric(5,2),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendance_record" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attendance_record_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_attendance_record_status" CHECK ("status" IN ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_attendance_record_tenant_employee_date" ON "attendance_record" ("tenant_id", "employee_id", "date")
    `);
    await enableRowLevelSecurity(queryRunner, 'attendance_record');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'attendance_record');
    await queryRunner.query(`DROP TABLE "attendance_record"`);
  }
}
