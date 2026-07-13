import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfitCenterProfile1752000000009 implements MigrationInterface {
  public name = 'CreateProfitCenterProfile1752000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "profit_center_profile" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "org_unit_id" uuid NOT NULL,
        "revenue_target_amount" numeric(18,4) NOT NULL,
        "revenue_target_currency" varchar(3) NOT NULL,
        "reporting_currency" varchar(3) NOT NULL,
        "gl_account_code" varchar(64),
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profit_center_profile" PRIMARY KEY ("id"),
        CONSTRAINT "FK_profit_center_profile_org_unit" FOREIGN KEY ("org_unit_id")
          REFERENCES "org_unit" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_profit_center_profile_org_unit" ON "profit_center_profile" ("org_unit_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_profit_center_profile_tenant_id" ON "profit_center_profile" ("tenant_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'profit_center_profile');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'profit_center_profile');
    await queryRunner.query(`DROP TABLE "profit_center_profile"`);
  }
}
