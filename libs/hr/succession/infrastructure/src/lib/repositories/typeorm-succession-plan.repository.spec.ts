import { EntityId, TenantId } from '@abms/kernel';
import { SuccessionPlan } from '@abms/hr-succession-domain';
import type { EntityManager, Repository } from 'typeorm';
import { SuccessionPlanOrmEntity } from '../entities/succession-plan-orm.entity';
import { TypeOrmSuccessionPlanRepository } from './typeorm-succession-plan.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<SuccessionPlanOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<SuccessionPlanOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmSuccessionPlanRepository', () => {
  it('findOpenByPosition reconstitutes a domain SuccessionPlan', async () => {
    const id = EntityId.create();
    const positionId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      positionId: positionId.toValue(),
      notes: null,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SuccessionPlanOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmSuccessionPlanRepository(
      manager as unknown as EntityManager,
    ).findOpenByPosition(TENANT_ID, positionId);

    expect(result?.status).toBe('OPEN');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const plan = SuccessionPlan.open({
      tenantId: TENANT_ID,
      positionId: EntityId.create(),
      notes: null,
    });

    await new TypeOrmSuccessionPlanRepository(manager as unknown as EntityManager).save(plan);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: plan.id.toValue(), status: 'OPEN' }),
    );
  });
});
