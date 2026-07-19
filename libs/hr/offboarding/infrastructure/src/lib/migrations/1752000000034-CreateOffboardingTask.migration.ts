import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOffboardingTask1752000000034 implements MigrationInterface {
  public name = 'CreateOffboardingTask1752000000034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "offboarding_task" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "offboarding_case_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "name" varchar(200) NOT NULL,
        "is_completed" boolean NOT NULL DEFAULT false,
        "completed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_offboarding_task" PRIMARY KEY ("id"),
        CONSTRAINT "FK_offboarding_task_offboarding_case" FOREIGN KEY ("offboarding_case_id") REFERENCES "offboarding_case" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_offboarding_task_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_offboarding_task_tenant_case" ON "offboarding_task" ("tenant_id", "offboarding_case_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'offboarding_task');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'offboarding_task');
    await queryRunner.query(`DROP TABLE "offboarding_task"`);
  }
}
