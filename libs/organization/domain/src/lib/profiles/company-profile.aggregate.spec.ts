import { BusinessRuleViolationException, CurrencyCode, EntityId, TaxIdentifier, CountryCode, TenantId } from '@abms/kernel';
import { CompanyProfile } from './company-profile.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const ORG_UNIT_ID = EntityId.create();
const TZS = CurrencyCode.create('TZS').getValue();
const TAX_ID = TaxIdentifier.create(CountryCode.create('TZ').getValue(), '123-456-789').getValue();

function createProps() {
  return {
    tenantId: TENANT_ID,
    orgUnitId: ORG_UNIT_ID,
    legalName: 'Afribiz Holdings Ltd',
    registrationNumber: 'REG-001',
    taxIdentifier: TAX_ID,
    functionalCurrency: TZS,
    fiscalYearStartMonth: 7,
  };
}

describe('CompanyProfile.create', () => {
  it('creates a company profile with version 1', () => {
    const profile = CompanyProfile.create(createProps());

    expect(profile.legalName).toBe('Afribiz Holdings Ltd');
    expect(profile.orgUnitId.equals(ORG_UNIT_ID)).toBe(true);
    expect(profile.functionalCurrency.value).toBe('TZS');
    expect(profile.version).toBe(1);
  });

  it('rejects an empty legalName', () => {
    expect(() => CompanyProfile.create({ ...createProps(), legalName: '' })).toThrow(
      BusinessRuleViolationException,
    );
  });

  it('rejects an empty registrationNumber', () => {
    expect(() => CompanyProfile.create({ ...createProps(), registrationNumber: '' })).toThrow(
      BusinessRuleViolationException,
    );
  });

  it('rejects a fiscalYearStartMonth outside 1-12', () => {
    expect(() => CompanyProfile.create({ ...createProps(), fiscalYearStartMonth: 13 })).toThrow(
      BusinessRuleViolationException,
    );
    expect(() => CompanyProfile.create({ ...createProps(), fiscalYearStartMonth: 0 })).toThrow(
      BusinessRuleViolationException,
    );
  });
});

describe('CompanyProfile.update', () => {
  it('replaces all mutable fields', () => {
    const profile = CompanyProfile.create(createProps());
    const usd = CurrencyCode.create('USD').getValue();

    profile.update({
      legalName: 'New Legal Name',
      registrationNumber: 'REG-002',
      taxIdentifier: TAX_ID,
      functionalCurrency: usd,
      fiscalYearStartMonth: 1,
    });

    expect(profile.legalName).toBe('New Legal Name');
    expect(profile.functionalCurrency.value).toBe('USD');
    expect(profile.fiscalYearStartMonth).toBe(1);
  });

  it('rejects an invalid fiscalYearStartMonth on update', () => {
    const profile = CompanyProfile.create(createProps());

    expect(() => profile.update({ ...createProps(), fiscalYearStartMonth: 15 })).toThrow(
      BusinessRuleViolationException,
    );
  });
});

describe('CompanyProfile.reconstitute', () => {
  it('rebuilds a profile from persisted state', () => {
    const id = EntityId.create();

    const profile = CompanyProfile.reconstitute({
      id,
      ...createProps(),
      version: 3,
    });

    expect(profile.id.equals(id)).toBe(true);
    expect(profile.version).toBe(3);
  });
});
