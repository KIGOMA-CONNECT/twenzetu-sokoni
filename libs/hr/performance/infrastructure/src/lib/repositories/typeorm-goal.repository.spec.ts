import { EntityId, TenantId } from '@abms/kernel';
import { Goal } from '@abms/hr-performance-domain';
import type { EntityManager, Repository } from 'typeorm';
import { GoalOrmEntity } from '../entities/goal-orm.entity';
import { TypeOrmGoalRepository } from './typeorm-goal.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<GoalOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<GoalOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmGoalRepository', () => {
  it('findById reconstitutes a domain Goal', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      employeeId: employeeId.toValue(),
      title: 'Ship v1',
      description: null,
      targetDate: '2026-12-31',
      status: 'ACTIVE',
      progressPercent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GoalOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmGoalRepository(manager as unknown as EntityManager).findById(id);

    expect(result?.title).toBe('Ship v1');
    expect(result?.status).toBe('ACTIVE');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const goal = Goal.set({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      title: 'Ship v1',
      description: null,
      targetDate: new Date('2026-12-31'),
    });

    await new TypeOrmGoalRepository(manager as unknown as EntityManager).save(goal);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: goal.id.toValue(), title: 'Ship v1', status: 'ACTIVE' }),
    );
  });
});
