import { EntityId, TenantId } from '@abms/kernel';
import { PayrollPeriod } from '@abms/hr-payroll-domain';
import type { EntityManager, Repository } from 'typeorm';
import { PayrollPeriodOrmEntity } from '../entities/payroll-period-orm.entity';
import { TypeOrmPayrollPeriodRepository } from './typeorm-payroll-period.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<PayrollPeriodOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<PayrollPeriodOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmPayrollPeriodRepository', () => {
  it('findByYearAndMonth reconstitutes a domain PayrollPeriod', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      year: 2026,
      month: 8,
      status: 'OPEN',
    } as PayrollPeriodOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmPayrollPeriodRepository(
      manager as unknown as EntityManager,
    ).findByYearAndMonth(TENANT_ID, 2026, 8);

    expect(result?.status).toBe('OPEN');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const period = PayrollPeriod.open({ tenantId: TENANT_ID, year: 2026, month: 8 });

    await new TypeOrmPayrollPeriodRepository(manager as unknown as EntityManager).save(period);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: period.id.toValue(), year: 2026, month: 8, status: 'OPEN' }),
    );
  });
});
