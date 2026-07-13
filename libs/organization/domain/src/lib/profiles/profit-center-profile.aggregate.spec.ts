import { CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { ProfitCenterProfile } from './profit-center-profile.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const ORG_UNIT_ID = EntityId.create();
const USD = CurrencyCode.create('USD').getValue();
const TARGET = Money.create('250000.00', USD).getValue();

function createProps() {
  return {
    tenantId: TENANT_ID,
    orgUnitId: ORG_UNIT_ID,
    revenueTarget: TARGET,
    reportingCurrency: USD,
  };
}

describe('ProfitCenterProfile.create', () => {
  it('creates a profit center profile with version 1', () => {
    const profile = ProfitCenterProfile.create(createProps());

    expect(profile.revenueTarget.amount).toBe('250000.00');
    expect(profile.reportingCurrency.value).toBe('USD');
    expect(profile.glAccountCode).toBeNull();
    expect(profile.version).toBe(1);
  });

  it('trims a provided glAccountCode', () => {
    const profile = ProfitCenterProfile.create({ ...createProps(), glAccountCode: ' GL-300 ' });

    expect(profile.glAccountCode).toBe('GL-300');
  });
});

describe('ProfitCenterProfile.update', () => {
  it('replaces all mutable fields', () => {
    const profile = ProfitCenterProfile.create(createProps());
    const newTarget = Money.create('300000.00', USD).getValue();

    profile.update({ revenueTarget: newTarget, reportingCurrency: USD, glAccountCode: 'GL-400' });

    expect(profile.revenueTarget.amount).toBe('300000.00');
    expect(profile.glAccountCode).toBe('GL-400');
  });
});

describe('ProfitCenterProfile.reconstitute', () => {
  it('rebuilds a profile from persisted state', () => {
    const id = EntityId.create();

    const profile = ProfitCenterProfile.reconstitute({
      id,
      ...createProps(),
      glAccountCode: null,
      version: 6,
    });

    expect(profile.id.equals(id)).toBe(true);
    expect(profile.version).toBe(6);
  });
});
