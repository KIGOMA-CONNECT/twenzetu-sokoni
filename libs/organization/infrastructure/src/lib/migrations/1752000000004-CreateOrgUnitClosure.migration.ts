import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

// No FK to org_unit: closure rows are mutated only by the repository's own
// transactional insert-leaf/reparent algorithm (see TypeOrmOrgUnitRepository),
// never by direct DDL cascades, so an FK constraint would add per-write checking
// cost without adding real safety.
export class CreateOrgUnitClosure1752000000004 implements MigrationInterface {
  public name = 'CreateOrgUnitClosure1752000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "org_unit_closure" (
        "ancestor_id" uuid NOT NULL,
        "descendant_id" uuid NOT NULL,
        "depth" integer NOT NULL,
        "tenant_id" uuid NOT NULL,
        CONSTRAINT "PK_org_unit_closure" PRIMARY KEY ("ancestor_id", "descendant_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_org_unit_closure_descendant_ancestor" ON "org_unit_closure" ("descendant_id", "ancestor_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_org_unit_closure_tenant_id" ON "org_unit_closure" ("tenant_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'org_unit_closure');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'org_unit_closure');
    await queryRunner.query(`DROP TABLE "org_unit_closure"`);
  }
}
