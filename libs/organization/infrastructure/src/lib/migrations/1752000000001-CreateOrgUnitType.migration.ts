import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrgUnitType1752000000001 implements MigrationInterface {
  public name = 'CreateOrgUnitType1752000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "org_unit_type" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(64) NOT NULL,
        "name" varchar(160) NOT NULL,
        "description" varchar(500),
        "is_system_defined" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_org_unit_type" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_org_unit_type_tenant_code" ON "org_unit_type" ("tenant_id", "code")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_org_unit_type_tenant_id" ON "org_unit_type" ("tenant_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'org_unit_type');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'org_unit_type');
    await queryRunner.query(`DROP TABLE "org_unit_type"`);
  }
}
