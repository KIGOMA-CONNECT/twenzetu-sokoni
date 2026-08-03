import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCourseEnrollment1752000000039 implements MigrationInterface {
  public name = 'CreateCourseEnrollment1752000000039';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "course_enrollment" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "enrolled_date" date NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'IN_PROGRESS',
        "score" integer,
        "completed_date" date,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_course_enrollment" PRIMARY KEY ("id"),
        CONSTRAINT "FK_course_enrollment_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_course_enrollment_course" FOREIGN KEY ("course_id") REFERENCES "course" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_course_enrollment_status" CHECK ("status" IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
        CONSTRAINT "CK_course_enrollment_score" CHECK ("score" IS NULL OR "score" BETWEEN 0 AND 100)
      )
    `);
    // Partial unique index: only one IN_PROGRESS enrollment per employee per
    // course at a time — mirrors benefit_enrollment's pattern (ADR-0014).
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_course_enrollment_tenant_employee_course_active"
      ON "course_enrollment" ("tenant_id", "employee_id", "course_id")
      WHERE "status" = 'IN_PROGRESS'
    `);
    await enableRowLevelSecurity(queryRunner, 'course_enrollment');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'course_enrollment');
    await queryRunner.query(`DROP TABLE "course_enrollment"`);
  }
}
