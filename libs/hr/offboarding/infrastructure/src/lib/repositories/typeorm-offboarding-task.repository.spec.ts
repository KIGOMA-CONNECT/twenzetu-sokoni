import { EntityId, TenantId } from '@abms/kernel';
import { OffboardingTask } from '@abms/hr-offboarding-domain';
import type { EntityManager, Repository } from 'typeorm';
import { OffboardingTaskOrmEntity } from '../entities/offboarding-task-orm.entity';
import { TypeOrmOffboardingTaskRepository } from './typeorm-offboarding-task.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<OffboardingTaskOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<OffboardingTaskOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmOffboardingTaskRepository', () => {
  it('findAllByCase reconstitutes domain OffboardingTasks', async () => {
    const id = EntityId.create();
    const offboardingCaseId = EntityId.create();
    const employeeId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.find.mockResolvedValue([
      {
        id: id.toValue(),
        tenantId: TENANT_ID.value,
        offboardingCaseId: offboardingCaseId.toValue(),
        employeeId: employeeId.toValue(),
        name: 'Return company equipment',
        isCompleted: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as OffboardingTaskOrmEntity,
    ]);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmOffboardingTaskRepository(
      manager as unknown as EntityManager,
    ).findAllByCase(TENANT_ID, offboardingCaseId);

    expect(result).toHaveLength(1);
    expect(result[0].isCompleted).toBe(false);
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const task = OffboardingTask.create({
      tenantId: TENANT_ID,
      offboardingCaseId: EntityId.create(),
      employeeId: EntityId.create(),
      name: 'Revoke system access',
    });

    await new TypeOrmOffboardingTaskRepository(manager as unknown as EntityManager).save(task);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: task.id.toValue(), name: 'Revoke system access', isCompleted: false }),
    );
  });
});
