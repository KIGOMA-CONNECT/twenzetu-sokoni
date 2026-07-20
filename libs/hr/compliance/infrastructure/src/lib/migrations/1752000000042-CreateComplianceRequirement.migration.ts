import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComplianceRequirement1752000000042 implements MigrationInterface {
  public name = 'CreateComplianceRequirement1752000000042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "compliance_requirement" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(200) NOT NULL,
        "description" text,
        "category" varchar(24) NOT NULL,
        "recurrence" varchar(16) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_compliance_requirement" PRIMARY KEY ("id"),
        CONSTRAINT "CK_compliance_requirement_category" CHECK ("category" IN ('SAFETY', 'LEGAL', 'CERTIFICATION', 'TRAINING', 'OTHER')),
        CONSTRAINT "CK_compliance_requirement_recurrence" CHECK ("recurrence" IN ('ONE_TIME', 'QUARTERLY', 'ANNUAL', 'BIENNIAL'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_compliance_requirement_tenant" ON "compliance_requirement" ("tenant_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'compliance_requirement');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'compliance_requirement');
    await queryRunner.query(`DROP TABLE "compliance_requirement"`);
  }
}
