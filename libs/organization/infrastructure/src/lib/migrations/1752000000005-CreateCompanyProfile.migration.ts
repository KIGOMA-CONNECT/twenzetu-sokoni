import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanyProfile1752000000005 implements MigrationInterface {
  public name = 'CreateCompanyProfile1752000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "company_profile" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "org_unit_id" uuid NOT NULL,
        "legal_name" varchar(200) NOT NULL,
        "registration_number" varchar(100) NOT NULL,
        "tax_country_code" varchar(2) NOT NULL,
        "tax_number" varchar(64) NOT NULL,
        "functional_currency" varchar(3) NOT NULL,
        "fiscal_year_start_month" integer NOT NULL,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_profile" PRIMARY KEY ("id"),
        CONSTRAINT "FK_company_profile_org_unit" FOREIGN KEY ("org_unit_id")
          REFERENCES "org_unit" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_company_profile_fiscal_year_start_month"
          CHECK ("fiscal_year_start_month" BETWEEN 1 AND 12)
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_company_profile_org_unit" ON "company_profile" ("org_unit_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_company_profile_tenant_id" ON "company_profile" ("tenant_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'company_profile');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'company_profile');
    await queryRunner.query(`DROP TABLE "company_profile"`);
  }
}
