import { TenantId } from '@abms/kernel';
import { Driver } from './driver.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function register(): Driver {
  return Driver.register({
    tenantId: TENANT_ID,
    fullName: 'Juma Mtwana',
    phone: '0712345678',
    licenseNumber: 'DL-0001',
  });
}

describe('Driver', () => {
  it('registers as UNVERIFIED/ACTIVE and emits an event', () => {
    const driver = register();

    expect(driver.verificationLevel).toBe('UNVERIFIED');
    expect(driver.status).toBe('ACTIVE');
    expect(driver.domainEvents).toHaveLength(1);
  });

  it('upgradeVerification() moves forward and emits an event', () => {
    const driver = register();

    driver.upgradeVerification('PHONE_VERIFIED');

    expect(driver.verificationLevel).toBe('PHONE_VERIFIED');
    expect(driver.domainEvents).toHaveLength(2);
  });

  it('rejects a backward or same-level verification transition', () => {
    const driver = register();
    driver.upgradeVerification('KYC_VERIFIED');

    expect(() => driver.upgradeVerification('PHONE_VERIFIED')).toThrow();
    expect(() => driver.upgradeVerification('KYC_VERIFIED')).toThrow();
  });

  it('suspend() transitions to SUSPENDED and is not idempotent', () => {
    const driver = register();

    driver.suspend();

    expect(driver.status).toBe('SUSPENDED');
    expect(() => driver.suspend()).toThrow();
  });

  it('assertActive() throws once suspended', () => {
    const driver = register();
    driver.suspend();

    expect(() => driver.assertActive('assign to a trip')).toThrow();
  });
});
