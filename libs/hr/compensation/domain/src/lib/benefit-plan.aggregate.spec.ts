import { TenantId } from '@abms/kernel';
import { BenefitPlan } from './benefit-plan.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('BenefitPlan', () => {
  it('creates as active and emits an event', () => {
    const plan = BenefitPlan.create({
      tenantId: TENANT_ID,
      name: 'Gold Health Plan',
      benefitType: 'HEALTH_INSURANCE',
      employerContributionRateBasisPoints: 500,
    });

    expect(plan.isActive).toBe(true);
    expect(plan.domainEvents).toHaveLength(1);
  });

  it('rejects a contribution rate above 100%', () => {
    expect(() =>
      BenefitPlan.create({
        tenantId: TENANT_ID,
        name: 'Gold Health Plan',
        benefitType: 'HEALTH_INSURANCE',
        employerContributionRateBasisPoints: 10_001,
      }),
    ).toThrow();
  });

  it('rejects an empty name', () => {
    expect(() =>
      BenefitPlan.create({
        tenantId: TENANT_ID,
        name: '  ',
        benefitType: 'PENSION',
        employerContributionRateBasisPoints: 1000,
      }),
    ).toThrow();
  });

  it('deactivate() is not idempotent', () => {
    const plan = BenefitPlan.create({
      tenantId: TENANT_ID,
      name: 'Pension Scheme A',
      benefitType: 'PENSION',
      employerContributionRateBasisPoints: 1000,
    });
    plan.deactivate();

    expect(() => plan.deactivate()).toThrow();
  });
});
