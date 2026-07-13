import { ConcurrencyDomainException, CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { ProfitCenterProfile } from '@abms/organization-domain';
import type { EntityManager, Repository } from 'typeorm';
import { ProfitCenterProfileOrmEntity } from '../entities/profit-center-profile-orm.entity';
import { TypeOrmProfitCenterProfileRepository } from './typeorm-profit-center-profile.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const ORG_UNIT_ID = EntityId.create();
const USD = CurrencyCode.create('USD').getValue();
const TARGET = Money.create('250000.00', USD).getValue();

function fakeOrmRepository(): jest.Mocked<Pick<Repository<ProfitCenterProfileOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>> {
  return {
    findOne: jest.fn(),
    count: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Pick<Repository<ProfitCenterProfileOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>>;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
    query: jest.fn(),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>>;
}

function createProfile(): ProfitCenterProfile {
  return ProfitCenterProfile.create({
    tenantId: TENANT_ID,
    orgUnitId: ORG_UNIT_ID,
    revenueTarget: TARGET,
    reportingCurrency: USD,
  });
}

describe('TypeOrmProfitCenterProfileRepository', () => {
  it('findByOrgUnitId returns null when no row exists', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue(null);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmProfitCenterProfileRepository(
      manager as unknown as EntityManager,
    ).findByOrgUnitId(ORG_UNIT_ID);

    expect(result).toBeNull();
  });

  it('save() inserts a new row when none exists', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    manager.query.mockResolvedValue([{ exists: false }]);
    const profile = createProfile();

    await new TypeOrmProfitCenterProfileRepository(manager as unknown as EntityManager).save(profile);

    expect(ormRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: profile.id.toValue(), revenueTargetAmount: '250000.00' }),
    );
  });

  it('save() throws ConcurrencyDomainException when the CAS update affects zero rows', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    manager.query.mockResolvedValueOnce([{ exists: true }]).mockResolvedValueOnce([[], 0]);
    const profile = createProfile();

    await expect(
      new TypeOrmProfitCenterProfileRepository(manager as unknown as EntityManager).save(profile),
    ).rejects.toBeInstanceOf(ConcurrencyDomainException);
  });
});
