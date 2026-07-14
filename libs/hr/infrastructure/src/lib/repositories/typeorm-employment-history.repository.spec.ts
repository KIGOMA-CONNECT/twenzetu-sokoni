import { EntityId, TenantId } from '@abms/kernel';
import { EmploymentHistoryEntry } from '@abms/hr-domain';
import type { EntityManager, Repository } from 'typeorm';
import { EmploymentHistoryOrmEntity } from '../entities/employment-history-orm.entity';
import { TypeOrmEmploymentHistoryRepository } from './typeorm-employment-history.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<Pick<Repository<EmploymentHistoryOrmEntity>, 'find' | 'insert'>> {
  return {
    find: jest.fn(),
    insert: jest.fn(),
  } as unknown as jest.Mocked<Pick<Repository<EmploymentHistoryOrmEntity>, 'find' | 'insert'>>;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmEmploymentHistoryRepository', () => {
  it('append() inserts a row (never updates/deletes)', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const employeeId = EntityId.create();
    const entry = EmploymentHistoryEntry.create({
      tenantId: TENANT_ID,
      employeeId,
      eventType: 'HIRED',
      effectiveDate: new Date('2026-01-01T00:00:00.000Z'),
      details: 'Hired.',
    });

    await new TypeOrmEmploymentHistoryRepository(manager as unknown as EntityManager).append(entry);

    expect(ormRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: entry.id.toValue(),
        employeeId: employeeId.toValue(),
        eventType: 'HIRED',
        effectiveDate: '2026-01-01',
      }),
    );
  });

  it('findByEmployeeId reconstitutes entries ordered by creation', async () => {
    const employeeId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.find.mockResolvedValue([
      {
        id: EntityId.create().toValue(),
        tenantId: TENANT_ID.value,
        employeeId: employeeId.toValue(),
        eventType: 'HIRED',
        effectiveDate: '2026-01-01',
        details: null,
      } as EmploymentHistoryOrmEntity,
    ]);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmEmploymentHistoryRepository(
      manager as unknown as EntityManager,
    ).findByEmployeeId(TENANT_ID, employeeId);

    expect(ormRepository.find).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID.value, employeeId: employeeId.toValue() },
      order: { createdAt: 'ASC' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].eventType).toBe('HIRED');
  });
});
