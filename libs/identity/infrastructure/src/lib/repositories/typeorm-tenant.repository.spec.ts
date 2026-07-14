import { EntityId } from '@abms/kernel';
import { Tenant } from '@abms/identity-domain';
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
      id: id.toValue(),
      name: 'Afribiz Holdings Ltd',
      status: 'ACTIVE',
    } as TenantOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmTenantRepository(manager as unknown as EntityManager).findById(id);

    expect(result?.name).toBe('Afribiz Holdings Ltd');
    expect(result?.status).toBe('ACTIVE');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const tenant = Tenant.create({ name: 'Afribiz Holdings Ltd' });

    await new TypeOrmTenantRepository(manager as unknown as EntityManager).save(tenant);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: tenant.id.toValue(), name: 'Afribiz Holdings Ltd', status: 'ACTIVE' }),
    );
  });
});
