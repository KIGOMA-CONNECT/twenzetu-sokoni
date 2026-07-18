import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOnboardingTask1752000000029 implements MigrationInterface {
  public name = 'CreateOnboardingTask1752000000029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "onboarding_task" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "name" varchar(200) NOT NULL,
        "is_completed" boolean NOT NULL DEFAULT false,
        "completed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_onboarding_task" PRIMARY KEY ("id"),
        CONSTRAINT "FK_onboarding_task_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_onboarding_task_tenant_employee" ON "onboarding_task" ("tenant_id", "employee_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'onboarding_task');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'onboarding_task');
    await queryRunner.query(`DROP TABLE "onboarding_task"`);
  }
}
