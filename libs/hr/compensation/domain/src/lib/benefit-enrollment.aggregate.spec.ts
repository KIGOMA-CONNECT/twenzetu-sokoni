import { EntityId, TenantId } from '@abms/kernel';
import { BenefitEnrollment } from './benefit-enrollment.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('BenefitEnrollment', () => {
  it('enrolls as active and emits an event', () => {
    const enrollment = BenefitEnrollment.enroll({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      benefitPlanId: EntityId.create(),
      effectiveDate: new Date('2026-08-01'),
    });

    expect(enrollment.status).toBe('ACTIVE');
    expect(enrollment.domainEvents).toHaveLength(1);
  });

  it('cancel() marks it cancelled and records a timestamp', () => {
    const enrollment = BenefitEnrollment.enroll({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      benefitPlanId: EntityId.create(),
      effectiveDate: new Date('2026-08-01'),
    });

    enrollment.cancel();

    expect(enrollment.status).toBe('CANCELLED');
    expect(enrollment.cancelledAt).not.toBeNull();
  });

  it('cancel() is not idempotent', () => {
    const enrollment = BenefitEnrollment.enroll({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      benefitPlanId: EntityId.create(),
      effectiveDate: new Date('2026-08-01'),
    });
    enrollment.cancel();

    expect(() => enrollment.cancel()).toThrow();
  });
});
