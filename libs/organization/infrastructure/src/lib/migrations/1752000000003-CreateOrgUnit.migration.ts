import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrgUnit1752000000003 implements MigrationInterface {
  public name = 'CreateOrgUnit1752000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "org_unit" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "org_unit_type_id" uuid NOT NULL,
        "parent_id" uuid,
        "code" varchar(64) NOT NULL,
        "name" varchar(160) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'ACTIVE',
        "sort_order" integer NOT NULL DEFAULT 0,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_org_unit" PRIMARY KEY ("id"),
        CONSTRAINT "FK_org_unit_type" FOREIGN KEY ("org_unit_type_id")
          REFERENCES "org_unit_type" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_org_unit_parent" FOREIGN KEY ("parent_id")
          REFERENCES "org_unit" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_org_unit_status" CHECK ("status" IN ('ACTIVE', 'INACTIVE'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_org_unit_tenant_code" ON "org_unit" ("tenant_id", "code")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_org_unit_tenant_parent" ON "org_unit" ("tenant_id", "parent_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'org_unit');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'org_unit');
    await queryRunner.query(`DROP TABLE "org_unit"`);
  }
}
