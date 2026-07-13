import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBranchProfile1752000000006 implements MigrationInterface {
  public name = 'CreateBranchProfile1752000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "branch_profile" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "org_unit_id" uuid NOT NULL,
        "address_line1" varchar(200) NOT NULL,
        "address_line2" varchar(200),
        "address_city" varchar(120) NOT NULL,
        "address_state_or_region" varchar(120),
        "address_postal_code" varchar(20),
        "address_country_code" varchar(2) NOT NULL,
        "operating_currency" varchar(3) NOT NULL,
        "contact_phone" varchar(32),
        "contact_email" varchar(254),
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_branch_profile" PRIMARY KEY ("id"),
        CONSTRAINT "FK_branch_profile_org_unit" FOREIGN KEY ("org_unit_id")
          REFERENCES "org_unit" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_branch_profile_org_unit" ON "branch_profile" ("org_unit_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_branch_profile_tenant_id" ON "branch_profile" ("tenant_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'branch_profile');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'branch_profile');
    await queryRunner.query(`DROP TABLE "branch_profile"`);
  }
}
