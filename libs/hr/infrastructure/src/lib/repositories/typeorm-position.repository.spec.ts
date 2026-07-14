import { EntityId, TenantId } from '@abms/kernel';
import { Position } from '@abms/hr-domain';
import type { EntityManager, Repository } from 'typeorm';
import { PositionOrmEntity } from '../entities/position-orm.entity';
import { TypeOrmPositionRepository } from './typeorm-position.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<PositionOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<PositionOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmPositionRepository', () => {
  it('findByCode reconstitutes a domain Position', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      code: 'SE',
      title: 'Software Engineer',
      description: null,
      isActive: true,
    } as PositionOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmPositionRepository(manager as unknown as EntityManager).findByCode(
      TENANT_ID,
      'SE',
    );

    expect(result?.title).toBe('Software Engineer');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const position = Position.create({ tenantId: TENANT_ID, code: 'SE', title: 'Software Engineer' });

    await new TypeOrmPositionRepository(manager as unknown as EntityManager).save(position);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: position.id.toValue(), code: 'SE' }),
    );
  });
});
