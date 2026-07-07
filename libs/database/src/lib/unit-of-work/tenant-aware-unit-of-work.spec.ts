import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import type { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { TenantContextMissingException } from './tenant-context-missing.exception';
import { TenantAwareUnitOfWork } from './tenant-aware-unit-of-work';

function fakeQueryRunner(): jest.Mocked<QueryRunner> {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue(undefined),
    manager: {} as EntityManager,
  } as unknown as jest.Mocked<QueryRunner>;
}

function fakeDataSource(queryRunner: QueryRunner): DataSource {
  return { createQueryRunner: () => queryRunner } as unknown as DataSource;
}

describe('TenantAwareUnitOfWork', () => {
  it('throws before opening any query when no tenant context is active', async () => {
    const queryRunner = fakeQueryRunner();
    const unitOfWork = new TenantAwareUnitOfWork(
      fakeDataSource(queryRunner),
      new AsyncLocalTenantContextStore(),
    );

    await expect(unitOfWork.withTransaction(async () => undefined)).rejects.toBeInstanceOf(
      TenantContextMissingException,
    );
    expect(queryRunner.connect).not.toHaveBeenCalled();
  });

  it('sets the Postgres session tenant id via set_config before running the work', async () => {
    const queryRunner = fakeQueryRunner();
    const tenantContext = new AsyncLocalTenantContextStore();
    const unitOfWork = new TenantAwareUnitOfWork(fakeDataSource(queryRunner), tenantContext);

    await tenantContext.run('tenant-a', () => unitOfWork.withTransaction(async () => undefined));

    expect(queryRunner.query).toHaveBeenCalledWith(
      `SELECT set_config('app.tenant_id', $1, true)`,
      ['tenant-a'],
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('passes a TypeOrmTransactionContext bound to the query runner manager into the work callback', async () => {
    const queryRunner = fakeQueryRunner();
    const tenantContext = new AsyncLocalTenantContextStore();
    const unitOfWork = new TenantAwareUnitOfWork(fakeDataSource(queryRunner), tenantContext);

    const result = await tenantContext.run('tenant-a', () =>
      unitOfWork.withTransaction(async (ctx) => {
        expect(ctx.manager).toBe(queryRunner.manager);
        return 'work-result';
      }),
    );

    expect(result).toBe('work-result');
  });

  it('rolls back and releases when the work callback throws', async () => {
    const queryRunner = fakeQueryRunner();
    const tenantContext = new AsyncLocalTenantContextStore();
    const unitOfWork = new TenantAwareUnitOfWork(fakeDataSource(queryRunner), tenantContext);

    await expect(
      tenantContext.run('tenant-a', () =>
        unitOfWork.withTransaction(async () => {
          throw new Error('handler failed');
        }),
      ),
    ).rejects.toThrow('handler failed');

    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });
});
