import type { EntityManager } from 'typeorm';
import { DEFAULT_TENANT_ID } from './default-tenant-id';
import { OrgUnitTypeSeeder } from './org-unit-type.seeder';

function fakeManager(query: jest.Mock): EntityManager {
  return {
    transaction: jest.fn((callback: (tx: { query: jest.Mock }) => Promise<unknown>) =>
      callback({ query }),
    ),
  } as unknown as EntityManager;
}

describe('OrgUnitTypeSeeder.shouldRun', () => {
  it('sets the tenant context before checking existence', async () => {
    const query = jest.fn().mockResolvedValue([{ exists: false }]);
    const seeder = new OrgUnitTypeSeeder();

    const result = await seeder.shouldRun(fakeManager(query));

    expect(query).toHaveBeenNthCalledWith(1, `SELECT set_config('app.tenant_id', $1, true)`, [
      DEFAULT_TENANT_ID,
    ]);
    expect(result).toBe(true);
  });

  it('returns false when types already exist for the default tenant', async () => {
    const query = jest.fn().mockResolvedValue([{ exists: true }]);
    const seeder = new OrgUnitTypeSeeder();

    const result = await seeder.shouldRun(fakeManager(query));

    expect(result).toBe(false);
  });
});

describe('OrgUnitTypeSeeder.run', () => {
  it('inserts all 14 default types then resolves allowed-parent join rows by code', async () => {
    const idRows = [
      { id: 'id-organization', code: 'ORGANIZATION' },
      { id: 'id-company', code: 'COMPANY' },
    ];
    const query = jest.fn<Promise<unknown>, [string, unknown[]?]>((sql) => {
      if (sql.includes('SELECT "id", "code"')) {
        return Promise.resolve(idRows);
      }
      return Promise.resolve(undefined);
    });
    const seeder = new OrgUnitTypeSeeder();

    await seeder.run(fakeManager(query));

    const insertTypeCalls = query.mock.calls.filter((call: unknown[]) =>
      (call[0] as string).includes('INSERT INTO "org_unit_type"'),
    );
    expect(insertTypeCalls).toHaveLength(14);

    // Only COMPANY's allowed parent (ORGANIZATION) is resolvable from idRows; every
    // other seed's allowed-parent codes aren't present in this fixture, so exactly
    // one join row insert fires.
    const joinInsertCalls = query.mock.calls.filter((call: unknown[]) =>
      (call[0] as string).includes('INSERT INTO "org_unit_type_allowed_parent"'),
    );
    expect(joinInsertCalls).toHaveLength(1);
    expect(joinInsertCalls[0][1]).toEqual(['id-company', 'id-organization', DEFAULT_TENANT_ID]);
  });
});
