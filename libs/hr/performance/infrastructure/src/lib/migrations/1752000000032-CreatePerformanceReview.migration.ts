import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePerformanceReview1752000000032 implements MigrationInterface {
  public name = 'CreatePerformanceReview1752000000032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "performance_review" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "review_cycle_id" uuid NOT NULL,
        "reviewer_user_id" uuid NOT NULL,
        "rating" integer,
        "comments" text,
        "status" varchar(16) NOT NULL DEFAULT 'DRAFT',
        "submitted_at" timestamptz,
        "acknowledged_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_performance_review" PRIMARY KEY ("id"),
        CONSTRAINT "FK_performance_review_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_performance_review_review_cycle" FOREIGN KEY ("review_cycle_id") REFERENCES "review_cycle" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_performance_review_status" CHECK ("status" IN ('DRAFT', 'SUBMITTED', 'ACKNOWLEDGED')),
        CONSTRAINT "CK_performance_review_rating" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5)
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_performance_review_tenant_employee_cycle" ON "performance_review" ("tenant_id", "employee_id", "review_cycle_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'performance_review');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'performance_review');
    await queryRunner.query(`DROP TABLE "performance_review"`);
  }
}
