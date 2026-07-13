import { Address, CountryCode, CurrencyCode, EntityId, TenantId } from '@abms/kernel';
import { BranchProfile } from './branch-profile.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const ORG_UNIT_ID = EntityId.create();
const KES = CurrencyCode.create('KES').getValue();
const ADDRESS = Address.create({
  line1: 'Moi Avenue',
  city: 'Nairobi',
  countryCode: CountryCode.create('KE').getValue(),
}).getValue();

function createProps() {
  return {
    tenantId: TENANT_ID,
    orgUnitId: ORG_UNIT_ID,
    address: ADDRESS,
    operatingCurrency: KES,
  };
}

describe('BranchProfile.create', () => {
  it('creates a branch profile with version 1 and null optional contacts by default', () => {
    const profile = BranchProfile.create(createProps());

    expect(profile.address.city).toBe('Nairobi');
    expect(profile.operatingCurrency.value).toBe('KES');
    expect(profile.contactPhone).toBeNull();
    expect(profile.contactEmail).toBeNull();
    expect(profile.version).toBe(1);
  });

  it('trims provided contact fields', () => {
    const profile = BranchProfile.create({
      ...createProps(),
      contactPhone: ' +254700000000 ',
      contactEmail: ' ops@example.com ',
    });

    expect(profile.contactPhone).toBe('+254700000000');
    expect(profile.contactEmail).toBe('ops@example.com');
  });
});

describe('BranchProfile.update', () => {
  it('replaces all mutable fields', () => {
    const profile = BranchProfile.create(createProps());
    const newAddress = Address.create({
      line1: 'Uhuru Highway',
      city: 'Mombasa',
      countryCode: CountryCode.create('KE').getValue(),
    }).getValue();

    profile.update({ address: newAddress, operatingCurrency: KES, contactPhone: '0722000000' });

    expect(profile.address.city).toBe('Mombasa');
    expect(profile.contactPhone).toBe('0722000000');
  });
});

describe('BranchProfile.reconstitute', () => {
  it('rebuilds a profile from persisted state', () => {
    const id = EntityId.create();

    const profile = BranchProfile.reconstitute({
      id,
      ...createProps(),
      contactPhone: null,
      contactEmail: null,
      version: 2,
    });

    expect(profile.id.equals(id)).toBe(true);
    expect(profile.version).toBe(2);
  });
});
