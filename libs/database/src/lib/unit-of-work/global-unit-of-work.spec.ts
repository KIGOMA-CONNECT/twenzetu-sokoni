import type { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { GlobalUnitOfWork } from './global-unit-of-work';

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

describe('GlobalUnitOfWork', () => {
  it('opens a transaction without setting any tenant GUC', async () => {
    const queryRunner = fakeQueryRunner();
    const unitOfWork = new GlobalUnitOfWork(fakeDataSource(queryRunner));

    await unitOfWork.withTransaction(async () => undefined);

    expect(queryRunner.connect).toHaveBeenCalledTimes(1);
    expect(queryRunner.query).not.toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('passes a TypeOrmTransactionContext bound to the query runner manager into the work callback', async () => {
    const queryRunner = fakeQueryRunner();
    const unitOfWork = new GlobalUnitOfWork(fakeDataSource(queryRunner));

    const result = await unitOfWork.withTransaction(async (ctx) => {
      expect(ctx.manager).toBe(queryRunner.manager);
      return 'work-result';
    });

    expect(result).toBe('work-result');
  });

  it('rolls back and releases when the work callback throws', async () => {
    const queryRunner = fakeQueryRunner();
    const unitOfWork = new GlobalUnitOfWork(fakeDataSource(queryRunner));

    await expect(
      unitOfWork.withTransaction(async () => {
        throw new Error('handler failed');
      }),
    ).rejects.toThrow('handler failed');

    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });
});
