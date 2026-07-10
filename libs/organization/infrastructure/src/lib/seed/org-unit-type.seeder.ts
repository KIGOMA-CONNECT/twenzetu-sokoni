import { ISeeder } from '@abms/database';
import { EntityManager } from 'typeorm';
import { DEFAULT_TENANT_ID } from './default-tenant-id';
import { ORG_UNIT_TYPE_SEEDS } from './org-unit-type-seeds';

interface ExistsRow {
  exists: boolean;
}

interface OrgUnitTypeIdRow {
  id: string;
  code: string;
}

// Every tenant-scoped table has FORCE ROW LEVEL SECURITY, so even this seeder
// (running via the owner role, outside TenantAwareUnitOfWork) must set the session
// tenant GUC before it can see or write any org_unit_type row — including the
// existence check in shouldRun(), not just the writes in run().
export class OrgUnitTypeSeeder implements ISeeder {
  public readonly name = 'OrgUnitTypeSeeder';
  public readonly order = 100;

  public async shouldRun(manager: EntityManager): Promise<boolean> {
    return manager.transaction(async (txManager) => {
      await txManager.query(`SELECT set_config('app.tenant_id', $1, true)`, [DEFAULT_TENANT_ID]);

      const rows: ExistsRow[] = await txManager.query(
        `SELECT EXISTS(SELECT 1 FROM "org_unit_type" WHERE "tenant_id" = $1) AS "exists"`,
        [DEFAULT_TENANT_ID],
      );

      return !(rows[0]?.exists ?? false);
    });
  }

  public async run(manager: EntityManager): Promise<void> {
    await manager.transaction(async (txManager) => {
      await txManager.query(`SELECT set_config('app.tenant_id', $1, true)`, [DEFAULT_TENANT_ID]);

      for (const seed of ORG_UNIT_TYPE_SEEDS) {
        await txManager.query(
          `INSERT INTO "org_unit_type"
             ("id", "tenant_id", "code", "name", "description", "is_system_defined", "is_active", "sort_order")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, true, true, $5)
           ON CONFLICT ("tenant_id", "code") DO NOTHING`,
          [
            DEFAULT_TENANT_ID,
            seed.code,
            seed.name,
            seed.description,
            ORG_UNIT_TYPE_SEEDS.indexOf(seed),
          ],
        );
      }

      const idRows: OrgUnitTypeIdRow[] = await txManager.query(
        `SELECT "id", "code" FROM "org_unit_type" WHERE "tenant_id" = $1`,
        [DEFAULT_TENANT_ID],
      );
      const idByCode = new Map(idRows.map((row) => [row.code, row.id]));

      for (const seed of ORG_UNIT_TYPE_SEEDS) {
        const typeId = idByCode.get(seed.code);
        if (!typeId) {
          continue;
        }
        for (const parentCode of seed.allowedParentCodes) {
          const parentId = idByCode.get(parentCode);
          if (!parentId) {
            continue;
          }
          await txManager.query(
            `INSERT INTO "org_unit_type_allowed_parent"
               ("org_unit_type_id", "allowed_parent_type_id", "tenant_id")
             VALUES ($1, $2, $3)
             ON CONFLICT ("org_unit_type_id", "allowed_parent_type_id") DO NOTHING`,
            [typeId, parentId, DEFAULT_TENANT_ID],
          );
        }
      }
    });
  }
}
