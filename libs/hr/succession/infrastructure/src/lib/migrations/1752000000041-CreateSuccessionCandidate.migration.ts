import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSuccessionCandidate1752000000041 implements MigrationInterface {
  public name = 'CreateSuccessionCandidate1752000000041';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "succession_candidate" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "succession_plan_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "readiness_level" varchar(24) NOT NULL,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_succession_candidate" PRIMARY KEY ("id"),
        CONSTRAINT "FK_succession_candidate_succession_plan" FOREIGN KEY ("succession_plan_id") REFERENCES "succession_plan" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_succession_candidate_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_succession_candidate_readiness_level" CHECK ("readiness_level" IN ('READY_NOW', 'READY_1_2_YEARS', 'READY_3_5_YEARS', 'NOT_READY')),
        CONSTRAINT "UQ_succession_candidate_plan_employee" UNIQUE ("tenant_id", "succession_plan_id", "employee_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_succession_candidate_tenant_plan" ON "succession_candidate" ("tenant_id", "succession_plan_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'succession_candidate');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'succession_candidate');
    await queryRunner.query(`DROP TABLE "succession_candidate"`);
  }
}
