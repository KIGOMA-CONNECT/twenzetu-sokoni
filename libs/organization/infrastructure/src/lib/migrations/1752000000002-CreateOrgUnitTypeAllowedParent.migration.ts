import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrgUnitTypeAllowedParent1752000000002 implements MigrationInterface {
  public name = 'CreateOrgUnitTypeAllowedParent1752000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "org_unit_type_allowed_parent" (
        "org_unit_type_id" uuid NOT NULL,
        "allowed_parent_type_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        CONSTRAINT "PK_org_unit_type_allowed_parent" PRIMARY KEY ("org_unit_type_id", "allowed_parent_type_id"),
        CONSTRAINT "FK_outap_org_unit_type" FOREIGN KEY ("org_unit_type_id")
          REFERENCES "org_unit_type" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_outap_allowed_parent_type" FOREIGN KEY ("allowed_parent_type_id")
          REFERENCES "org_unit_type" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_org_unit_type_allowed_parent_tenant_id" ON "org_unit_type_allowed_parent" ("tenant_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'org_unit_type_allowed_parent');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'org_unit_type_allowed_parent');
    await queryRunner.query(`DROP TABLE "org_unit_type_allowed_parent"`);
  }
}
