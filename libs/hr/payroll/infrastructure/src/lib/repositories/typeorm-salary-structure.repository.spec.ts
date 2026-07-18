import { CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { SalaryStructure } from '@abms/hr-payroll-domain';
import type { EntityManager, Repository } from 'typeorm';
import { SalaryStructureOrmEntity } from '../entities/salary-structure-orm.entity';
import { TypeOrmSalaryStructureRepository } from './typeorm-salary-structure.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const TZS = CurrencyCode.create('TZS').getValue();

function tzs(amount: string): Money {
  return Money.create(amount, TZS).getValue();
}

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<SalaryStructureOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<SalaryStructureOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmSalaryStructureRepository', () => {
  it('findActiveByEmployee reconstitutes basicSalary and allowances as Money', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      employeeId: employeeId.toValue(),
      basicSalary: '500000.0000',
      currency: 'TZS',
      allowances: [{ name: 'Transport', amount: '50000.0000' }],
      effectiveFrom: '2026-01-01',
      isActive: true,
    } as SalaryStructureOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmSalaryStructureRepository(
      manager as unknown as EntityManager,
    ).findActiveByEmployee(TENANT_ID, employeeId);

    expect(result?.basicSalary.amount).toBe('500000.0000');
    expect(result?.allowances[0].amount.amount).toBe('50000.0000');
    expect(result?.grossMonthlySalary.amount).toBe('550000.0000');
  });

  it('save() upserts the row with basicSalary as a decimal string and allowances as jsonb', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const structure = SalaryStructure.create({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      basicSalary: tzs('500000'),
      allowances: [{ name: 'Transport', amount: tzs('50000') }],
      effectiveFrom: new Date('2026-01-01'),
    });

    await new TypeOrmSalaryStructureRepository(manager as unknown as EntityManager).save(structure);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: structure.id.toValue(),
        basicSalary: '500000',
        currency: 'TZS',
        allowances: [{ name: 'Transport', amount: '50000' }],
      }),
    );
  });
});
