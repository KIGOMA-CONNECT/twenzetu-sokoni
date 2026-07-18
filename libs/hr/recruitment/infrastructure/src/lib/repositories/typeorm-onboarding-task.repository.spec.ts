import { EntityId, TenantId } from '@abms/kernel';
import { OnboardingTask } from '@abms/hr-recruitment-domain';
import type { EntityManager, Repository } from 'typeorm';
import { OnboardingTaskOrmEntity } from '../entities/onboarding-task-orm.entity';
import { TypeOrmOnboardingTaskRepository } from './typeorm-onboarding-task.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<OnboardingTaskOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<OnboardingTaskOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmOnboardingTaskRepository', () => {
  it('findAllByEmployee reconstitutes domain OnboardingTasks', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.find.mockResolvedValue([
      {
        id: id.toValue(),
        tenantId: TENANT_ID.value,
        employeeId: employeeId.toValue(),
        name: 'IT equipment setup',
        isCompleted: false,
        completedAt: null,
      } as OnboardingTaskOrmEntity,
    ]);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmOnboardingTaskRepository(
      manager as unknown as EntityManager,
    ).findAllByEmployee(TENANT_ID, employeeId);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('IT equipment setup');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const task = OnboardingTask.create({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      name: 'Orientation',
    });

    await new TypeOrmOnboardingTaskRepository(manager as unknown as EntityManager).save(task);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: task.id.toValue(), name: 'Orientation', isCompleted: false }),
    );
  });
});
