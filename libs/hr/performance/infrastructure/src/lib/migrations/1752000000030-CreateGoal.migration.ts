import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGoal1752000000030 implements MigrationInterface {
  public name = 'CreateGoal1752000000030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "goal" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text,
        "target_date" date NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'ACTIVE',
        "progress_percent" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_goal" PRIMARY KEY ("id"),
        CONSTRAINT "FK_goal_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_goal_status" CHECK ("status" IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
        CONSTRAINT "CK_goal_progress_percent" CHECK ("progress_percent" BETWEEN 0 AND 100)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_goal_tenant_employee" ON "goal" ("tenant_id", "employee_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'goal');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'goal');
    await queryRunner.query(`DROP TABLE "goal"`);
  }
}
