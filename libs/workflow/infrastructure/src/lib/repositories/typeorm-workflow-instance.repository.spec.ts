import { EntityId, TenantId } from '@abms/kernel';
import { WorkflowInstance } from '@abms/workflow-domain';
import type { EntityManager, Repository } from 'typeorm';
import { WorkflowInstanceOrmEntity } from '../entities/workflow-instance-orm.entity';
import { TypeOrmWorkflowInstanceRepository } from './typeorm-workflow-instance.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<WorkflowInstanceOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<WorkflowInstanceOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmWorkflowInstanceRepository', () => {
  it('findById returns null when no row exists', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue(null);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmWorkflowInstanceRepository(
      manager as unknown as EntityManager,
    ).findById(EntityId.create());

    expect(result).toBeNull();
  });

  it('findById reconstitutes a domain WorkflowInstance', async () => {
    const id = EntityId.create();
    const workflowDefinitionId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      workflowDefinitionId: workflowDefinitionId.toValue(),
      subjectType: 'ORG_UNIT',
      subjectId: 'org-unit-1',
      status: 'PENDING',
      steps: [
        {
          stepOrder: 1,
          approverRole: 'CEO',
          status: 'PENDING',
          decidedByUserId: null,
          decidedAt: null,
          comment: null,
        },
      ],
      version: 1,
    } as WorkflowInstanceOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmWorkflowInstanceRepository(
      manager as unknown as EntityManager,
    ).findById(id);

    expect(result?.status).toBe('PENDING');
    expect(result?.workflowDefinitionId.equals(workflowDefinitionId)).toBe(true);
  });

  it('save() upserts the row including the steps as jsonb', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const instance = WorkflowInstance.start({
      tenantId: TENANT_ID,
      workflowDefinitionId: EntityId.create(),
      subjectType: 'ORG_UNIT',
      subjectId: 'org-unit-1',
      steps: [{ stepOrder: 1, approverRole: 'CEO' }],
    });

    await new TypeOrmWorkflowInstanceRepository(manager as unknown as EntityManager).save(instance);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: instance.id.toValue(), status: 'PENDING', subjectId: 'org-unit-1' }),
    );
  });

  it('findBySubject returns every instance matching the tenant/subject', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.find.mockResolvedValue([
      {
        id: EntityId.create().toValue(),
        tenantId: TENANT_ID.value,
        workflowDefinitionId: EntityId.create().toValue(),
        subjectType: 'ORG_UNIT',
        subjectId: 'org-unit-1',
        status: 'PENDING',
        steps: [],
        version: 1,
      } as unknown as WorkflowInstanceOrmEntity,
    ]);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmWorkflowInstanceRepository(
      manager as unknown as EntityManager,
    ).findBySubject(TENANT_ID, 'ORG_UNIT', 'org-unit-1');

    expect(ormRepository.find).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID.value, subjectType: 'ORG_UNIT', subjectId: 'org-unit-1' },
    });
    expect(result).toHaveLength(1);
  });
});
