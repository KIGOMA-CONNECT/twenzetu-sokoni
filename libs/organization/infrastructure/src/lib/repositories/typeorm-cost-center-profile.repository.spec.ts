import { ConcurrencyDomainException, CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { CostCenterProfile } from '@abms/organization-domain';
import type { EntityManager, Repository } from 'typeorm';
import { CostCenterProfileOrmEntity } from '../entities/cost-center-profile-orm.entity';
import { TypeOrmCostCenterProfileRepository } from './typeorm-cost-center-profile.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const ORG_UNIT_ID = EntityId.create();
const TZS = CurrencyCode.create('TZS').getValue();
const BUDGET = Money.create('50000.00', TZS).getValue();

function fakeOrmRepository(): jest.Mocked<Pick<Repository<CostCenterProfileOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>> {
  return {
    findOne: jest.fn(),
    count: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Pick<Repository<CostCenterProfileOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>>;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
    query: jest.fn(),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>>;
}

function createProfile(): CostCenterProfile {
  return CostCenterProfile.create({
    tenantId: TENANT_ID,
    orgUnitId: ORG_UNIT_ID,
    budget: BUDGET,
    budgetPeriodStart: new Date('2026-01-01'),
    budgetPeriodEnd: new Date('2026-12-31'),
  });
}

describe('TypeOrmCostCenterProfileRepository', () => {
  it('findByOrgUnitId reconstitutes budget as Money and dates as Date', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      orgUnitId: ORG_UNIT_ID.toValue(),
      budgetAmount: '50000.0000',
      budgetCurrency: 'TZS',
      budgetPeriodStart: '2026-01-01',
      budgetPeriodEnd: '2026-12-31',
      glAccountCode: null,
      version: 1,
    } as CostCenterProfileOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmCostCenterProfileRepository(
      manager as unknown as EntityManager,
    ).findByOrgUnitId(ORG_UNIT_ID);

    expect(result?.budget.amount).toBe('50000.0000');
    expect(result?.budget.currency.value).toBe('TZS');
    expect(result?.budgetPeriodStart).toBeInstanceOf(Date);
  });

  it('save() inserts a new row when none exists', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    manager.query.mockResolvedValue([{ exists: false }]);
    const profile = createProfile();

    await new TypeOrmCostCenterProfileRepository(manager as unknown as EntityManager).save(profile);

    expect(ormRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: profile.id.toValue(), budgetAmount: '50000.00' }),
    );
  });

  it('save() throws ConcurrencyDomainException when the CAS update affects zero rows', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    manager.query.mockResolvedValueOnce([{ exists: true }]).mockResolvedValueOnce([[], 0]);
    const profile = createProfile();

    await expect(
      new TypeOrmCostCenterProfileRepository(manager as unknown as EntityManager).save(profile),
    ).rejects.toBeInstanceOf(ConcurrencyDomainException);
  });
});
