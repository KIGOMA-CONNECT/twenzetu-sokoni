import { Address, ConcurrencyDomainException, CountryCode, CurrencyCode, EntityId, TenantId } from '@abms/kernel';
import { BranchProfile } from '@abms/organization-domain';
import type { EntityManager, Repository } from 'typeorm';
import { BranchProfileOrmEntity } from '../entities/branch-profile-orm.entity';
import { TypeOrmBranchProfileRepository } from './typeorm-branch-profile.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const ORG_UNIT_ID = EntityId.create();
const KE = CountryCode.create('KE').getValue();
const KES = CurrencyCode.create('KES').getValue();
const ADDRESS = Address.create({ line1: 'Moi Avenue', city: 'Nairobi', countryCode: KE }).getValue();

function fakeOrmRepository(): jest.Mocked<Pick<Repository<BranchProfileOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>> {
  return {
    findOne: jest.fn(),
    count: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Pick<Repository<BranchProfileOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>>;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
    query: jest.fn(),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>>;
}

describe('TypeOrmBranchProfileRepository', () => {
  it('findByOrgUnitId returns null when no row exists', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue(null);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmBranchProfileRepository(
      manager as unknown as EntityManager,
    ).findByOrgUnitId(ORG_UNIT_ID);

    expect(result).toBeNull();
  });

  it('save() inserts a new row when none exists', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    manager.query.mockResolvedValue([{ exists: false }]);
    const profile = BranchProfile.create({
      tenantId: TENANT_ID,
      orgUnitId: ORG_UNIT_ID,
      address: ADDRESS,
      operatingCurrency: KES,
    });

    await new TypeOrmBranchProfileRepository(manager as unknown as EntityManager).save(profile);

    expect(ormRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: profile.id.toValue(), addressCity: 'Nairobi' }),
    );
  });

  it('save() throws ConcurrencyDomainException when the CAS update affects zero rows', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    manager.query.mockResolvedValueOnce([{ exists: true }]).mockResolvedValueOnce([[], 0]);
    const profile = BranchProfile.create({
      tenantId: TENANT_ID,
      orgUnitId: ORG_UNIT_ID,
      address: ADDRESS,
      operatingCurrency: KES,
    });

    await expect(
      new TypeOrmBranchProfileRepository(manager as unknown as EntityManager).save(profile),
    ).rejects.toBeInstanceOf(ConcurrencyDomainException);
  });
});
