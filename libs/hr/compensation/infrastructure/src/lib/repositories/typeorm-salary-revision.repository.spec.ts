import { CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { SalaryRevision } from '@abms/hr-compensation-domain';
import type { EntityManager, Repository } from 'typeorm';
import { SalaryRevisionOrmEntity } from '../entities/salary-revision-orm.entity';
import { TypeOrmSalaryRevisionRepository } from './typeorm-salary-revision.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const TZS = CurrencyCode.create('TZS').getValue();

function tzs(amount: string): Money {
  return Money.create(amount, TZS).getValue();
}

function fakeOrmRepository(): jest.Mocked<Pick<Repository<SalaryRevisionOrmEntity>, 'insert' | 'find'>> {
  return {
    insert: jest.fn(),
    find: jest.fn(),
  } as unknown as jest.Mocked<Pick<Repository<SalaryRevisionOrmEntity>, 'insert' | 'find'>>;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmSalaryRevisionRepository', () => {
  it('findByEmployeeId reconstitutes domain SalaryRevisions', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.find.mockResolvedValue([
      {
        id: id.toValue(),
        tenantId: TENANT_ID.value,
        employeeId: employeeId.toValue(),
        reason: 'MERIT_INCREASE',
        previousBasicSalary: '500000.0000',
        newBasicSalary: '550000.0000',
        currency: 'TZS',
        effectiveDate: '2026-08-01',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SalaryRevisionOrmEntity,
    ]);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmSalaryRevisionRepository(
      manager as unknown as EntityManager,
    ).findByEmployeeId(TENANT_ID, employeeId);

    expect(result).toHaveLength(1);
    expect(result[0].newBasicSalary.amount).toBe('550000.0000');
  });

  it('append() inserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const revision = SalaryRevision.record({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      reason: 'PROMOTION',
      previousBasicSalary: tzs('500000'),
      newBasicSalary: tzs('600000'),
      effectiveDate: new Date('2026-08-01'),
    });

    await new TypeOrmSalaryRevisionRepository(manager as unknown as EntityManager).append(revision);

    expect(ormRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: revision.id.toValue(), reason: 'PROMOTION', newBasicSalary: '600000' }),
    );
  });
});
