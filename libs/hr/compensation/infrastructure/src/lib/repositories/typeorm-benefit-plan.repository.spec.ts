import { EntityId, TenantId } from '@abms/kernel';
import { BenefitPlan } from '@abms/hr-compensation-domain';
import type { EntityManager, Repository } from 'typeorm';
import { BenefitPlanOrmEntity } from '../entities/benefit-plan-orm.entity';
import { TypeOrmBenefitPlanRepository } from './typeorm-benefit-plan.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<BenefitPlanOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<BenefitPlanOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmBenefitPlanRepository', () => {
  it('findAllByTenant reconstitutes domain BenefitPlans', async () => {
    const id = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.find.mockResolvedValue([
      {
        id: id.toValue(),
        tenantId: TENANT_ID.value,
        name: 'Gold Health Plan',
        benefitType: 'HEALTH_INSURANCE',
        employerContributionRateBasisPoints: 500,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as BenefitPlanOrmEntity,
    ]);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmBenefitPlanRepository(manager as unknown as EntityManager).findAllByTenant(
      TENANT_ID,
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Gold Health Plan');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const plan = BenefitPlan.create({
      tenantId: TENANT_ID,
      name: 'Pension Scheme A',
      benefitType: 'PENSION',
      employerContributionRateBasisPoints: 1000,
    });

    await new TypeOrmBenefitPlanRepository(manager as unknown as EntityManager).save(plan);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: plan.id.toValue(), name: 'Pension Scheme A', isActive: true }),
    );
  });
});
