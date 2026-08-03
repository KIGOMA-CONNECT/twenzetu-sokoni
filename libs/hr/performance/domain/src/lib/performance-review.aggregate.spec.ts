import { EntityId, TenantId } from '@abms/kernel';
import { PerformanceReview } from './performance-review.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function startReview(): PerformanceReview {
  return PerformanceReview.start({
    tenantId: TENANT_ID,
    employeeId: EntityId.create(),
    reviewCycleId: EntityId.create(),
    reviewerUserId: EntityId.create().toValue(),
  });
}

describe('PerformanceReview', () => {
  it('start() begins in DRAFT with no rating', () => {
    const review = startReview();

    expect(review.status).toBe('DRAFT');
    expect(review.rating).toBeNull();
    expect(review.domainEvents).toHaveLength(0);
  });

  it('submit() records the rating/comments and transitions to SUBMITTED', () => {
    const review = startReview();

    review.submit(4, 'Strong quarter.');

    expect(review.status).toBe('SUBMITTED');
    expect(review.rating).toBe(4);
    expect(review.comments).toBe('Strong quarter.');
    expect(review.submittedAt).not.toBeNull();
    expect(review.domainEvents).toHaveLength(1);
  });

  it('submit() rejects a rating outside 1-5', () => {
    const review = startReview();

    expect(() => review.submit(6, null)).toThrow();
  });

  it('submit() is not valid once already submitted', () => {
    const review = startReview();
    review.submit(3, null);

    expect(() => review.submit(4, null)).toThrow();
  });

  it('acknowledge() requires SUBMITTED status first', () => {
    const review = startReview();

    expect(() => review.acknowledge()).toThrow();
  });

  it('acknowledge() transitions SUBMITTED -> ACKNOWLEDGED', () => {
    const review = startReview();
    review.submit(5, 'Excellent.');

    review.acknowledge();

    expect(review.status).toBe('ACKNOWLEDGED');
    expect(review.acknowledgedAt).not.toBeNull();
  });
});
