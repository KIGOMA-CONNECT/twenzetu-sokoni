import { EntityId, TenantId } from '@abms/kernel';
import { ReviewCycle } from '@abms/hr-performance-domain';
import type { EntityManager, Repository } from 'typeorm';
import { ReviewCycleOrmEntity } from '../entities/review-cycle-orm.entity';
import { TypeOrmReviewCycleRepository } from './typeorm-review-cycle.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<ReviewCycleOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<ReviewCycleOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmReviewCycleRepository', () => {
  it('findAllByTenant reconstitutes domain ReviewCycles', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.find.mockResolvedValue([
      {
        id: id.toValue(),
        tenantId: TENANT_ID.value,
        name: '2026 H2',
        startDate: '2026-07-01',
        endDate: '2026-12-31',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ReviewCycleOrmEntity,
    ]);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmReviewCycleRepository(
      manager as unknown as EntityManager,
    ).findAllByTenant(TENANT_ID);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('OPEN');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const cycle = ReviewCycle.open({
      tenantId: TENANT_ID,
      name: '2026 H2',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-12-31'),
    });

    await new TypeOrmReviewCycleRepository(manager as unknown as EntityManager).save(cycle);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: cycle.id.toValue(), name: '2026 H2', status: 'OPEN' }),
    );
  });
});
