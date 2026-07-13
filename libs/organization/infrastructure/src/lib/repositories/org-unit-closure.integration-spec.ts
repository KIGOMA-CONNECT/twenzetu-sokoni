import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, TenantId } from '@abms/kernel';
import { OrgUnit } from '@abms/organization-domain';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { DataSource } from 'typeorm';
import { ORGANIZATION_ENTITIES } from '../organization-entities';
import { TypeOrmOrgUnitRepository } from './typeorm-org-unit.repository';

const TEST_TENANT_ID = '33333333-3333-4333-8333-333333333333';

interface ClosureRow {
  ancestor_id: string;
  descendant_id: string;
  depth: number;
}

describe('Organization closure-table correctness (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: TenantAwareUnitOfWork;
  let tenantContext: AsyncLocalTenantContextStore;
  let orgUnitTypeId: EntityId;
  const tenantId = TenantId.create(TEST_TENANT_ID).getValue();

  beforeAll(async () => {
    const config = new AppConfigService(process.env);

    ownerDataSource = new DataSource({
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      username: config.database.ownerUser,
      password: config.database.ownerPassword,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      logging: false,
    });
    await ownerDataSource.initialize();

    runtimeDataSource = new DataSource({
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      username: config.database.runtimeUser,
      password: config.database.runtimePassword,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      logging: false,
      entities: ORGANIZATION_ENTITIES,
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);

    orgUnitTypeId = EntityId.create();
    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction((ctx) =>
        ctx.manager.query(
          `INSERT INTO "org_unit_type"
             ("id", "tenant_id", "code", "name", "is_system_defined", "is_active", "sort_order")
           VALUES ($1, $2, 'CLOSURE_TEST_TYPE', 'Closure Test Type', false, true, 0)`,
          [orgUnitTypeId.toValue(), TEST_TENANT_ID],
        ),
      ),
    );
  });

  afterAll(async () => {
    // FORCE ROW LEVEL SECURITY applies to the owner role too, not just the runtime role —
    // the tenant GUC must be set within the same transaction before these DELETEs, or RLS
    // silently filters them to zero rows affected (see rls-helper.ts's inline comment).
    await ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "org_unit_closure" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "org_unit" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
      await manager.query(`DELETE FROM "org_unit_type" WHERE "tenant_id" = $1`, [TEST_TENANT_ID]);
    });
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  async function createOrgUnit(code: string, parentId: EntityId | null): Promise<OrgUnit> {
    return tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmOrgUnitRepository(ctx.manager);
        const orgUnit = OrgUnit.create({
          tenantId,
          orgUnitTypeId,
          parentId,
          code,
          name: code,
        });
        await repository.save(orgUnit);
        return orgUnit;
      }),
    );
  }

  async function fetchClosureRows(): Promise<ClosureRow[]> {
    return ownerDataSource.transaction(async (manager) => {
      await manager.query(`SELECT set_config('app.tenant_id', $1, true)`, [TEST_TENANT_ID]);
      return manager.query(
        `SELECT "ancestor_id", "descendant_id", "depth" FROM "org_unit_closure"
         WHERE "tenant_id" = $1
         ORDER BY "ancestor_id", "descendant_id"`,
        [TEST_TENANT_ID],
      );
    });
  }

  function pairSet(rows: ClosureRow[]): Set<string> {
    return new Set(rows.map((row) => `${row.ancestor_id}->${row.descendant_id}:${row.depth}`));
  }

  it('builds the correct closure rows for a 4-level tree, reparents a subtree correctly, and rejects cyclic moves without mutating anything', async () => {
    // --- Step 1: build A -> B -> C -> D and assert the full closure row set ---
    const a = await createOrgUnit('A', null);
    const b = await createOrgUnit('B', a.id);
    const c = await createOrgUnit('C', b.id);
    const d = await createOrgUnit('D', c.id);

    let rows = await fetchClosureRows();
    expect(rows).toHaveLength(10); // 4 self rows + 6 ancestor-descendant pairs
    let pairs = pairSet(rows);
    expect(pairs.has(`${a.id.toValue()}->${a.id.toValue()}:0`)).toBe(true);
    expect(pairs.has(`${b.id.toValue()}->${b.id.toValue()}:0`)).toBe(true);
    expect(pairs.has(`${c.id.toValue()}->${c.id.toValue()}:0`)).toBe(true);
    expect(pairs.has(`${d.id.toValue()}->${d.id.toValue()}:0`)).toBe(true);
    expect(pairs.has(`${a.id.toValue()}->${b.id.toValue()}:1`)).toBe(true);
    expect(pairs.has(`${b.id.toValue()}->${c.id.toValue()}:1`)).toBe(true);
    expect(pairs.has(`${c.id.toValue()}->${d.id.toValue()}:1`)).toBe(true);
    expect(pairs.has(`${a.id.toValue()}->${c.id.toValue()}:2`)).toBe(true);
    expect(pairs.has(`${b.id.toValue()}->${d.id.toValue()}:2`)).toBe(true);
    expect(pairs.has(`${a.id.toValue()}->${d.id.toValue()}:3`)).toBe(true);

    // --- Step 2: add E as a second child of A (sibling of B) ---
    const e = await createOrgUnit('E', a.id);

    // --- Step 3: reparent C (bringing its child D along) from B to E ---
    await tenantContext.run(TEST_TENANT_ID, () =>
      unitOfWork.withTransaction(async (ctx) => {
        const repository = new TypeOrmOrgUnitRepository(ctx.manager);
        const loadedC = await repository.findById(c.id);
        if (!loadedC) {
          throw new Error('test setup error: C not found');
        }
        loadedC.reparent(e.id, false);
        await repository.save(loadedC);
      }),
    );

    rows = await fetchClosureRows();
    pairs = pairSet(rows);
    // Tree is now: A -> {B, E -> C -> D}. 5 self rows + 4 depth-1 + 2 depth-2 + 1 depth-3 = 12.
    expect(rows).toHaveLength(12);
    expect(pairs.has(`${e.id.toValue()}->${e.id.toValue()}:0`)).toBe(true);
    // A->B is untouched by the reparent — B was never part of C's subtree.
    expect(pairs.has(`${a.id.toValue()}->${b.id.toValue()}:1`)).toBe(true);
    expect(pairs.has(`${a.id.toValue()}->${e.id.toValue()}:1`)).toBe(true);
    expect(pairs.has(`${e.id.toValue()}->${c.id.toValue()}:1`)).toBe(true);
    expect(pairs.has(`${c.id.toValue()}->${d.id.toValue()}:1`)).toBe(true);
    expect(pairs.has(`${e.id.toValue()}->${d.id.toValue()}:2`)).toBe(true);
    // A is now C and D's ancestor transitively through E, not directly through B.
    expect(pairs.has(`${a.id.toValue()}->${c.id.toValue()}:2`)).toBe(true);
    expect(pairs.has(`${a.id.toValue()}->${d.id.toValue()}:3`)).toBe(true);
    // The old B->C and B->D links are gone now that C moved out from under B.
    expect(pairs.has(`${b.id.toValue()}->${c.id.toValue()}:1`)).toBe(false);
    expect(pairs.has(`${b.id.toValue()}->${d.id.toValue()}:2`)).toBe(false);

    // --- Step 4: reject a self-move (A onto itself) and leave the closure table untouched ---
    let before = await fetchClosureRows();
    await expect(
      tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction(async (ctx) => {
          const repository = new TypeOrmOrgUnitRepository(ctx.manager);
          const loadedA = await repository.findById(a.id);
          if (!loadedA) {
            throw new Error('test setup error: A not found');
          }
          const wouldCreateCycle = await repository.wouldCreateCycle(a.id, a.id);
          loadedA.reparent(a.id, wouldCreateCycle);
          await repository.save(loadedA);
        }),
      ),
    ).rejects.toThrow();
    let after = await fetchClosureRows();
    expect(after).toEqual(before);

    // --- Step 5: reject moving A under D, its own descendant, and leave the closure table untouched ---
    before = await fetchClosureRows();
    await expect(
      tenantContext.run(TEST_TENANT_ID, () =>
        unitOfWork.withTransaction(async (ctx) => {
          const repository = new TypeOrmOrgUnitRepository(ctx.manager);
          const loadedA = await repository.findById(a.id);
          if (!loadedA) {
            throw new Error('test setup error: A not found');
          }
          const wouldCreateCycle = await repository.wouldCreateCycle(a.id, d.id);
          loadedA.reparent(d.id, wouldCreateCycle);
          await repository.save(loadedA);
        }),
      ),
    ).rejects.toThrow();
    after = await fetchClosureRows();
    expect(after).toEqual(before);
  });
});
