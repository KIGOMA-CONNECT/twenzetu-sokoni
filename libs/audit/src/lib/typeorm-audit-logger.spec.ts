import type { DataSource, Repository } from 'typeorm';
import { AuditLogOrmEntity } from './audit-log-orm.entity';
import { TypeOrmAuditLogger } from './typeorm-audit-logger';

function fakeDataSource(): { dataSource: DataSource; repository: jest.Mocked<Pick<Repository<AuditLogOrmEntity>, 'insert'>> } {
  const repository = { insert: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<
    Pick<Repository<AuditLogOrmEntity>, 'insert'>
  >;
  const dataSource = { getRepository: jest.fn().mockReturnValue(repository) } as unknown as DataSource;
  return { dataSource, repository };
}

describe('TypeOrmAuditLogger', () => {
  it('inserts a SUCCESS entry', async () => {
    const { dataSource, repository } = fakeDataSource();
    const logger = new TypeOrmAuditLogger(dataSource);

    await logger.log({
      commandName: 'CreateOrgUnitCommand',
      tenantId: 'tenant-a',
      userId: 'user-a',
      correlationId: 'corr-1',
      outcome: 'SUCCESS',
    });

    expect(repository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        commandName: 'CreateOrgUnitCommand',
        tenantId: 'tenant-a',
        userId: 'user-a',
        correlationId: 'corr-1',
        outcome: 'SUCCESS',
        errorMessage: null,
      }),
    );
  });

  it('inserts a FAILURE entry with an error message', async () => {
    const { dataSource, repository } = fakeDataSource();
    const logger = new TypeOrmAuditLogger(dataSource);

    await logger.log({
      commandName: 'LoginCommand',
      tenantId: null,
      userId: null,
      correlationId: 'corr-2',
      outcome: 'FAILURE',
      errorMessage: 'Invalid email or password.',
    });

    expect(repository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: null,
        userId: null,
        outcome: 'FAILURE',
        errorMessage: 'Invalid email or password.',
      }),
    );
  });
});
