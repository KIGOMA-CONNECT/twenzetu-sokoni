import { TenantId } from '@abms/kernel';
import { FleetOwner } from './fleet-owner.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function register(): FleetOwner {
  return FleetOwner.register({
    tenantId: TENANT_ID,
    businessName: 'Kigoma Logistics Co',
    phone: '0755000111',
  });
}

describe('FleetOwner', () => {
  it('registers as UNVERIFIED/ACTIVE and emits an event', () => {
    const owner = register();

    expect(owner.verificationLevel).toBe('UNVERIFIED');
    expect(owner.status).toBe('ACTIVE');
    expect(owner.domainEvents).toHaveLength(1);
  });

  it('upgradeVerification() moves forward and emits an event', () => {
    const owner = register();

    owner.upgradeVerification('KYC_VERIFIED');

    expect(owner.verificationLevel).toBe('KYC_VERIFIED');
    expect(owner.domainEvents).toHaveLength(2);
  });

  it('suspend() transitions to SUSPENDED and is not idempotent', () => {
    const owner = register();

    owner.suspend();

    expect(owner.status).toBe('SUSPENDED');
    expect(() => owner.suspend()).toThrow();
  });
});
