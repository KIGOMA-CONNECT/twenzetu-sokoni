import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBenefitPlan1752000000036 implements MigrationInterface {
  public name = 'CreateBenefitPlan1752000000036';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "benefit_plan" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(160) NOT NULL,
        "benefit_type" varchar(24) NOT NULL,
        "employer_contribution_rate_basis_points" integer NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_benefit_plan" PRIMARY KEY ("id"),
        CONSTRAINT "CK_benefit_plan_benefit_type" CHECK ("benefit_type" IN ('HEALTH_INSURANCE', 'PENSION', 'LIFE_INSURANCE', 'DISABILITY_INSURANCE', 'OTHER')),
        CONSTRAINT "CK_benefit_plan_contribution_rate" CHECK ("employer_contribution_rate_basis_points" BETWEEN 0 AND 10000)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_benefit_plan_tenant" ON "benefit_plan" ("tenant_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'benefit_plan');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'benefit_plan');
    await queryRunner.query(`DROP TABLE "benefit_plan"`);
  }
}
