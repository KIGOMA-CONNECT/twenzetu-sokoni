import { EntityId } from '@afri-market/kernel';
import { Tenant } from '@afri-market/identity-domain';
import type { EntityManager, Repository } from 'typeorm';
import { TenantOrmEntity } from '../entities/tenant-orm.entity';
import { TypeOrmTenantRepository } from './typeorm-tenant.repository';

function fakeOrmRepository(): jest.Mocked<Pick<Repository<TenantOrmEntity>, 'findOne' | 'count' | 'save' | 'delete'>> {
  return {
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Pick<Repository<TenantOrmEntity>, 'findOne' | 'count' | 'save' | 'delete'>>;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
    query: jest.fn(),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository' | 'query'>>;
}

describe('TypeOrmTenantRepository', () => {
  it('findById returns null when no row exists', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue(null);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmTenantRepository(manager as unknown as EntityManager).findById(
      EntityId.create(),
    );

    expect(result).toBeNull();
  });

  it('findById reconstitutes a domain Tenant', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.value,
      name: 'Afribiz Holdings Ltd',
      status: 'ACTIVE',
      isDefault: true,
    } as TenantOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmTenantRepository(manager as unknown as EntityManager).findById(id);

    expect(result?.name).toBe('Afribiz Holdings Ltd');
    expect(result?.status).toBe('ACTIVE');
    expect(result?.isDefault).toBe(true);
  });

  it('findDefault returns the active default tenant', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.value,
      name: 'Afribiz Holdings Ltd',
      status: 'ACTIVE',
      isDefault: true,
    } as TenantOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmTenantRepository(manager as unknown as EntityManager).findDefault();

    expect(result?.id.value).toBe(id.value);
    expect(ormRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isDefault: true, status: 'ACTIVE' } }),
    );
  });

  it('findDefault falls back to the first active tenant when none is flagged', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValueOnce(null);
    ormRepository.findOne.mockResolvedValueOnce({
      id: EntityId.create().value,
      name: 'Afribiz Holdings Ltd',
      status: 'ACTIVE',
      isDefault: false,
    } as TenantOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmTenantRepository(manager as unknown as EntityManager).findDefault();

    expect(result?.isDefault).toBe(false);
    expect(ormRepository.findOne).toHaveBeenCalledTimes(2);
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const tenant = Tenant.create({ name: 'Afribiz Holdings Ltd' });

    await new TypeOrmTenantRepository(manager as unknown as EntityManager).save(tenant);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: tenant.id.value, name: 'Afribiz Holdings Ltd', status: 'ACTIVE', isDefault: false }),
    );
  });
});
