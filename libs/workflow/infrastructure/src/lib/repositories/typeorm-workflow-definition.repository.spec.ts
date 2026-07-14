import { EntityId, TenantId } from '@abms/kernel';
import { WorkflowDefinition } from '@abms/workflow-domain';
import type { EntityManager, Repository } from 'typeorm';
import { WorkflowDefinitionOrmEntity } from '../entities/workflow-definition-orm.entity';
import { TypeOrmWorkflowDefinitionRepository } from './typeorm-workflow-definition.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<WorkflowDefinitionOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<WorkflowDefinitionOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmWorkflowDefinitionRepository', () => {
  it('findById returns null when no row exists', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue(null);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmWorkflowDefinitionRepository(
      manager as unknown as EntityManager,
    ).findById(EntityId.create());

    expect(result).toBeNull();
  });

  it('findByCode reconstitutes a domain WorkflowDefinition', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      code: 'ORG_UNIT_APPROVAL',
      name: 'Org Unit Approval',
      steps: [{ stepOrder: 1, approverRole: 'CEO' }],
      isActive: true,
      version: 1,
    } as WorkflowDefinitionOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmWorkflowDefinitionRepository(
      manager as unknown as EntityManager,
    ).findByCode(TENANT_ID, 'ORG_UNIT_APPROVAL');

    expect(result?.code).toBe('ORG_UNIT_APPROVAL');
    expect(result?.steps).toEqual([{ stepOrder: 1, approverRole: 'CEO' }]);
  });

  it('save() upserts the row including the steps as jsonb', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const definition = WorkflowDefinition.create({
      tenantId: TENANT_ID,
      code: 'ORG_UNIT_APPROVAL',
      name: 'Org Unit Approval',
      approverRoles: ['PROJECT_MANAGER', 'CEO'],
    });

    await new TypeOrmWorkflowDefinitionRepository(manager as unknown as EntityManager).save(definition);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: definition.id.toValue(),
        code: 'ORG_UNIT_APPROVAL',
        steps: [
          { stepOrder: 1, approverRole: 'PROJECT_MANAGER' },
          { stepOrder: 2, approverRole: 'CEO' },
        ],
      }),
    );
  });

  it('findAllByTenant reconstitutes every row for the tenant', async () => {
    const ormRepository = fakeOrmRepository();
    ormRepository.find.mockResolvedValue([
      {
        id: EntityId.create().toValue(),
        tenantId: TENANT_ID.value,
        code: 'ORG_UNIT_APPROVAL',
        name: 'Org Unit Approval',
        steps: [{ stepOrder: 1, approverRole: 'CEO' }],
        isActive: true,
        version: 1,
      } as WorkflowDefinitionOrmEntity,
    ]);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmWorkflowDefinitionRepository(
      manager as unknown as EntityManager,
    ).findAllByTenant(TENANT_ID);

    expect(ormRepository.find).toHaveBeenCalledWith({ where: { tenantId: TENANT_ID.value } });
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('ORG_UNIT_APPROVAL');
  });
});
