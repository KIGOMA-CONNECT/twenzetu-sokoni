import { EntityId, TenantId } from '@abms/kernel';
import { BenefitEnrollment } from '@abms/hr-compensation-domain';
import type { EntityManager, Repository } from 'typeorm';
import { BenefitEnrollmentOrmEntity } from '../entities/benefit-enrollment-orm.entity';
import { TypeOrmBenefitEnrollmentRepository } from './typeorm-benefit-enrollment.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<BenefitEnrollmentOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<BenefitEnrollmentOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmBenefitEnrollmentRepository', () => {
  it('findActiveByEmployeeAndPlan reconstitutes a domain BenefitEnrollment', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const benefitPlanId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      employeeId: employeeId.toValue(),
      benefitPlanId: benefitPlanId.toValue(),
      effectiveDate: '2026-08-01',
      status: 'ACTIVE',
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as BenefitEnrollmentOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmBenefitEnrollmentRepository(
      manager as unknown as EntityManager,
    ).findActiveByEmployeeAndPlan(TENANT_ID, employeeId, benefitPlanId);

    expect(result?.status).toBe('ACTIVE');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const enrollment = BenefitEnrollment.enroll({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      benefitPlanId: EntityId.create(),
      effectiveDate: new Date('2026-08-01'),
    });

    await new TypeOrmBenefitEnrollmentRepository(manager as unknown as EntityManager).save(enrollment);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: enrollment.id.toValue(), status: 'ACTIVE' }),
    );
  });
});
