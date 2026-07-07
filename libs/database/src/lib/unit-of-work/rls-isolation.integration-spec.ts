import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { DataSource } from 'typeorm';
import { disableRowLevelSecurity, enableRowLevelSecurity } from '../migrations/support/rls-helper';
import { TenantAwareUnitOfWork } from './tenant-aware-unit-of-work';

const TABLE_NAME = '_rls_isolation_test_items';
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';

describe('Row-Level Security cross-tenant isolation (integration)', () => {
  let ownerDataSource: DataSource;
  let runtimeDataSource: DataSource;
  let unitOfWork: TenantAwareUnitOfWork;
  let tenantContext: AsyncLocalTenantContextStore;

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

    await ownerDataSource.query(`
      CREATE TABLE "${TABLE_NAME}" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL,
        name text NOT NULL
      )
    `);
    const setupRunner = ownerDataSource.createQueryRunner();
    await enableRowLevelSecurity(setupRunner, TABLE_NAME);
    await setupRunner.release();

    runtimeDataSource = new DataSource({
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      username: config.database.runtimeUser,
      password: config.database.runtimePassword,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      logging: false,
    });
    await runtimeDataSource.initialize();

    tenantContext = new AsyncLocalTenantContextStore();
    unitOfWork = new TenantAwareUnitOfWork(runtimeDataSource, tenantContext);
  });

  afterAll(async () => {
    const teardownRunner = ownerDataSource.createQueryRunner();
    await disableRowLevelSecurity(teardownRunner, TABLE_NAME);
    await teardownRunner.release();
    await ownerDataSource.query(`DROP TABLE IF EXISTS "${TABLE_NAME}"`);
    await ownerDataSource.destroy();
    await runtimeDataSource.destroy();
  });

  it('lets each tenant see only the rows it inserted', async () => {
    await tenantContext.run(TENANT_A, () =>
      unitOfWork.withTransaction((ctx) =>
        ctx.manager.query(`INSERT INTO "${TABLE_NAME}" (tenant_id, name) VALUES ($1, $2)`, [
          TENANT_A,
          'Item A',
        ]),
      ),
    );
    await tenantContext.run(TENANT_B, () =>
      unitOfWork.withTransaction((ctx) =>
        ctx.manager.query(`INSERT INTO "${TABLE_NAME}" (tenant_id, name) VALUES ($1, $2)`, [
          TENANT_B,
          'Item B',
        ]),
      ),
    );

    const rowsForA = await tenantContext.run(TENANT_A, () =>
      unitOfWork.withTransaction((ctx) => ctx.manager.query(`SELECT * FROM "${TABLE_NAME}"`)),
    );
    const rowsForB = await tenantContext.run(TENANT_B, () =>
      unitOfWork.withTransaction((ctx) => ctx.manager.query(`SELECT * FROM "${TABLE_NAME}"`)),
    );

    expect(rowsForA).toHaveLength(1);
    expect(rowsForA[0].name).toBe('Item A');
    expect(rowsForB).toHaveLength(1);
    expect(rowsForB[0].name).toBe('Item B');
  });

  it('returns zero rows at the database level when no tenant session variable is set (fail closed)', async () => {
    const queryRunner = runtimeDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const rows = await queryRunner.query(`SELECT * FROM "${TABLE_NAME}"`);
      expect(rows).toHaveLength(0);
    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  });

  it('rejects an insert that claims a different tenant than the active session context', async () => {
    await expect(
      tenantContext.run(TENANT_A, () =>
        unitOfWork.withTransaction((ctx) =>
          ctx.manager.query(`INSERT INTO "${TABLE_NAME}" (tenant_id, name) VALUES ($1, $2)`, [
            TENANT_B,
            'Should be rejected',
          ]),
        ),
      ),
    ).rejects.toThrow();
  });

  it('throws before touching the database when no tenant context is active', async () => {
    await expect(unitOfWork.withTransaction(async () => undefined)).rejects.toThrow(
      'No tenant context is active for this transaction.',
    );
  });
});
