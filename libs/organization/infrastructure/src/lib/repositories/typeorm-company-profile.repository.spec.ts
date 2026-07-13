import { ConcurrencyDomainException, CountryCode, CurrencyCode, EntityId, TaxIdentifier, TenantId } from '@abms/kernel';
import { CompanyProfile } from '@abms/organization-domain';
import type { EntityManager, Repository } from 'typeorm';
import { CompanyProfileOrmEntity } from '../entities/company-profile-orm.entity';
import { TypeOrmCompanyProfileRepository } from './typeorm-company-profile.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const ORG_UNIT_ID = EntityId.create();
const TAX_ID = TaxIdentifier.create(CountryCode.create('TZ').getValue(), '123-456').getValue();
const TZS = CurrencyCode.create('TZS').getValue();

function fakeOrmRepository(): jest.Mocked<Pick<Repository<CompanyProfileOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>> {
  return {
    findOne: jest.fn(),
    count: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Pick<Repository<CompanyProfileOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>>;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
    query: jest.fn(),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>>;
}

describe('TypeOrmCompanyProfileRepository', () => {
  it('findByOrgUnitId returns null when no row exists', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue(null);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmCompanyProfileRepository(
      manager as unknown as EntityManager,
    ).findByOrgUnitId(ORG_UNIT_ID);

    expect(result).toBeNull();
  });

  it('findByOrgUnitId reconstitutes a domain CompanyProfile', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      orgUnitId: ORG_UNIT_ID.toValue(),
      legalName: 'Afribiz Ltd',
      registrationNumber: 'REG-001',
      taxCountryCode: 'TZ',
      taxNumber: '123-456',
      functionalCurrency: 'TZS',
      fiscalYearStartMonth: 7,
      version: 1,
    } as CompanyProfileOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmCompanyProfileRepository(
      manager as unknown as EntityManager,
    ).findByOrgUnitId(ORG_UNIT_ID);

    expect(result?.legalName).toBe('Afribiz Ltd');
    expect(result?.functionalCurrency.value).toBe('TZS');
  });

  it('save() inserts a new row when none exists', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    manager.query.mockResolvedValue([{ exists: false }]);
    const profile = CompanyProfile.create({
      tenantId: TENANT_ID,
      orgUnitId: ORG_UNIT_ID,
      legalName: 'Afribiz Ltd',
      registrationNumber: 'REG-001',
      taxIdentifier: TAX_ID,
      functionalCurrency: TZS,
      fiscalYearStartMonth: 7,
    });

    await new TypeOrmCompanyProfileRepository(manager as unknown as EntityManager).save(profile);

    expect(ormRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: profile.id.toValue(), legalName: 'Afribiz Ltd' }),
    );
  });

  it('save() throws ConcurrencyDomainException when the CAS update affects zero rows', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    manager.query
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([[], 0]);
    const profile = CompanyProfile.create({
      tenantId: TENANT_ID,
      orgUnitId: ORG_UNIT_ID,
      legalName: 'Afribiz Ltd',
      registrationNumber: 'REG-001',
      taxIdentifier: TAX_ID,
      functionalCurrency: TZS,
      fiscalYearStartMonth: 7,
    });

    await expect(
      new TypeOrmCompanyProfileRepository(manager as unknown as EntityManager).save(profile),
    ).rejects.toBeInstanceOf(ConcurrencyDomainException);
  });
});
