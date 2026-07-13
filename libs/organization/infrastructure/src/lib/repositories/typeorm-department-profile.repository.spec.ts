import { ConcurrencyDomainException, EntityId, TenantId } from '@abms/kernel';
import { DepartmentProfile } from '@abms/organization-domain';
import type { EntityManager, Repository } from 'typeorm';
import { DepartmentProfileOrmEntity } from '../entities/department-profile-orm.entity';
import { TypeOrmDepartmentProfileRepository } from './typeorm-department-profile.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const ORG_UNIT_ID = EntityId.create();

function fakeOrmRepository(): jest.Mocked<Pick<Repository<DepartmentProfileOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>> {
  return {
    findOne: jest.fn(),
    count: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Pick<Repository<DepartmentProfileOrmEntity>, 'findOne' | 'count' | 'insert' | 'delete'>>;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
    query: jest.fn(),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>>;
}

describe('TypeOrmDepartmentProfileRepository', () => {
  it('findByOrgUnitId returns null when no row exists', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue(null);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmDepartmentProfileRepository(
      manager as unknown as EntityManager,
    ).findByOrgUnitId(ORG_UNIT_ID);

    expect(result).toBeNull();
  });

  it('save() inserts a new row when none exists', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    manager.query.mockResolvedValue([{ exists: false }]);
    const profile = DepartmentProfile.create({ tenantId: TENANT_ID, orgUnitId: ORG_UNIT_ID });

    await new TypeOrmDepartmentProfileRepository(manager as unknown as EntityManager).save(profile);

    expect(ormRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: profile.id.toValue(), orgUnitId: ORG_UNIT_ID.toValue() }),
    );
  });

  it('save() throws ConcurrencyDomainException when the CAS update affects zero rows', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    manager.query.mockResolvedValueOnce([{ exists: true }]).mockResolvedValueOnce([[], 0]);
    const profile = DepartmentProfile.create({ tenantId: TENANT_ID, orgUnitId: ORG_UNIT_ID });

    await expect(
      new TypeOrmDepartmentProfileRepository(manager as unknown as EntityManager).save(profile),
    ).rejects.toBeInstanceOf(ConcurrencyDomainException);
  });
});
