import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCourse1752000000038 implements MigrationInterface {
  public name = 'CreateCourse1752000000038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "course" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text,
        "duration_hours" integer NOT NULL,
        "category" varchar(24) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_course" PRIMARY KEY ("id"),
        CONSTRAINT "CK_course_category" CHECK ("category" IN ('COMPLIANCE', 'TECHNICAL', 'LEADERSHIP', 'SOFT_SKILLS', 'OTHER')),
        CONSTRAINT "CK_course_duration_hours" CHECK ("duration_hours" BETWEEN 1 AND 1000)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_course_tenant" ON "course" ("tenant_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'course');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'course');
    await queryRunner.query(`DROP TABLE "course"`);
  }
}
