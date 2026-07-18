import { EntityId, TenantId } from '@abms/kernel';
import { PerformanceReview } from '@abms/hr-performance-domain';
import type { EntityManager, Repository } from 'typeorm';
import { PerformanceReviewOrmEntity } from '../entities/performance-review-orm.entity';
import { TypeOrmPerformanceReviewRepository } from './typeorm-performance-review.repository';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function fakeOrmRepository(): jest.Mocked<
  Pick<Repository<PerformanceReviewOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<Repository<PerformanceReviewOrmEntity>, 'findOne' | 'find' | 'count' | 'save' | 'delete'>
  >;
}

function fakeManager(repository: unknown): jest.Mocked<Pick<EntityManager, 'getRepository'>> {
  return {
    getRepository: jest.fn().mockReturnValue(repository),
  } as unknown as jest.Mocked<Pick<EntityManager, 'getRepository'>>;
}

describe('TypeOrmPerformanceReviewRepository', () => {
  it('findByEmployeeAndCycle reconstitutes a domain PerformanceReview', async () => {
    const id = EntityId.create();
    const employeeId = EntityId.create();
    const reviewCycleId = EntityId.create();
    const ormRepository = fakeOrmRepository();
    ormRepository.findOne.mockResolvedValue({
      id: id.toValue(),
      tenantId: TENANT_ID.value,
      employeeId: employeeId.toValue(),
      reviewCycleId: reviewCycleId.toValue(),
      reviewerUserId: 'reviewer-1',
      rating: null,
      comments: null,
      status: 'DRAFT',
      submittedAt: null,
      acknowledgedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PerformanceReviewOrmEntity);
    const manager = fakeManager(ormRepository);

    const result = await new TypeOrmPerformanceReviewRepository(
      manager as unknown as EntityManager,
    ).findByEmployeeAndCycle(TENANT_ID, employeeId, reviewCycleId);

    expect(result?.status).toBe('DRAFT');
    expect(result?.reviewerUserId).toBe('reviewer-1');
  });

  it('save() upserts the row', async () => {
    const ormRepository = fakeOrmRepository();
    const manager = fakeManager(ormRepository);
    const review = PerformanceReview.start({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      reviewCycleId: EntityId.create(),
      reviewerUserId: 'reviewer-1',
    });

    await new TypeOrmPerformanceReviewRepository(manager as unknown as EntityManager).save(review);

    expect(ormRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: review.id.toValue(), status: 'DRAFT', reviewerUserId: 'reviewer-1' }),
    );
  });
});
