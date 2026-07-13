import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDepartmentProfile1752000000007 implements MigrationInterface {
  public name = 'CreateDepartmentProfile1752000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "department_profile" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "org_unit_id" uuid NOT NULL,
        "cost_center_org_unit_id" uuid,
        "manager_reference" varchar(200),
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_department_profile" PRIMARY KEY ("id"),
        CONSTRAINT "FK_department_profile_org_unit" FOREIGN KEY ("org_unit_id")
          REFERENCES "org_unit" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_department_profile_cost_center" FOREIGN KEY ("cost_center_org_unit_id")
          REFERENCES "org_unit" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_department_profile_org_unit" ON "department_profile" ("org_unit_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_department_profile_tenant_id" ON "department_profile" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_department_profile_cost_center" ON "department_profile" ("cost_center_org_unit_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'department_profile');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'department_profile');
    await queryRunner.query(`DROP TABLE "department_profile"`);
  }
}
