import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCostCenterProfile1752000000008 implements MigrationInterface {
  public name = 'CreateCostCenterProfile1752000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cost_center_profile" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "org_unit_id" uuid NOT NULL,
        "budget_amount" numeric(18,4) NOT NULL,
        "budget_currency" varchar(3) NOT NULL,
        "budget_period_start" date NOT NULL,
        "budget_period_end" date NOT NULL,
        "gl_account_code" varchar(64),
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cost_center_profile" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cost_center_profile_org_unit" FOREIGN KEY ("org_unit_id")
          REFERENCES "org_unit" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_cost_center_profile_period"
          CHECK ("budget_period_end" >= "budget_period_start")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_cost_center_profile_org_unit" ON "cost_center_profile" ("org_unit_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_cost_center_profile_tenant_id" ON "cost_center_profile" ("tenant_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'cost_center_profile');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'cost_center_profile');
    await queryRunner.query(`DROP TABLE "cost_center_profile"`);
  }
}
