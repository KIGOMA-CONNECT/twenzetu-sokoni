import { BusinessRuleViolationException, CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { CostCenterProfile } from './cost-center-profile.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const ORG_UNIT_ID = EntityId.create();
const TZS = CurrencyCode.create('TZS').getValue();
const BUDGET = Money.create('50000.00', TZS).getValue();

function createProps() {
  return {
    tenantId: TENANT_ID,
    orgUnitId: ORG_UNIT_ID,
    budget: BUDGET,
    budgetPeriodStart: new Date('2026-01-01'),
    budgetPeriodEnd: new Date('2026-12-31'),
  };
}

describe('CostCenterProfile.create', () => {
  it('creates a cost center profile with version 1', () => {
    const profile = CostCenterProfile.create(createProps());

    expect(profile.budget.amount).toBe('50000.00');
    expect(profile.glAccountCode).toBeNull();
    expect(profile.version).toBe(1);
  });

  it('rejects a budget period end before start', () => {
    expect(() =>
      CostCenterProfile.create({
        ...createProps(),
        budgetPeriodStart: new Date('2026-12-31'),
        budgetPeriodEnd: new Date('2026-01-01'),
      }),
    ).toThrow(BusinessRuleViolationException);
  });

  it('accepts a period where end equals start', () => {
    const sameDay = new Date('2026-06-01');

    expect(() =>
      CostCenterProfile.create({ ...createProps(), budgetPeriodStart: sameDay, budgetPeriodEnd: sameDay }),
    ).not.toThrow();
  });
});

describe('CostCenterProfile.update', () => {
  it('replaces all mutable fields', () => {
    const profile = CostCenterProfile.create(createProps());
    const newBudget = Money.create('75000.00', TZS).getValue();

    profile.update({ ...createProps(), budget: newBudget, glAccountCode: 'GL-100' });

    expect(profile.budget.amount).toBe('75000.00');
    expect(profile.glAccountCode).toBe('GL-100');
  });

  it('rejects an invalid period on update', () => {
    const profile = CostCenterProfile.create(createProps());

    expect(() =>
      profile.update({
        ...createProps(),
        budgetPeriodStart: new Date('2026-12-31'),
        budgetPeriodEnd: new Date('2026-01-01'),
      }),
    ).toThrow(BusinessRuleViolationException);
  });
});

describe('CostCenterProfile.reconstitute', () => {
  it('rebuilds a profile from persisted state', () => {
    const id = EntityId.create();

    const profile = CostCenterProfile.reconstitute({
      id,
      ...createProps(),
      glAccountCode: 'GL-200',
      version: 5,
    });

    expect(profile.id.equals(id)).toBe(true);
    expect(profile.glAccountCode).toBe('GL-200');
    expect(profile.version).toBe(5);
  });
});
