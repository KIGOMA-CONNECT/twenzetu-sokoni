import { EntityId } from '@afri-market/kernel';
import { FeatureFlag } from './feature-flag.aggregate';

describe('FeatureFlag.define', () => {
  it('creates a flag with DISABLED state and 100% percentage', () => {
    const flag = FeatureFlag.define({
      key: 'new_dashboard',
      name: 'New Dashboard',
    });

    expect(flag.key).toBe('new_dashboard');
    expect(flag.name).toBe('New Dashboard');
    expect(flag.state).toBe('DISABLED');
    expect(flag.percentage).toBe(100);
    expect(flag.allowedTenantIds).toEqual([]);
    expect(flag.allowedRoles).toEqual([]);
  });

  it('accepts optional properties', () => {
    const flag = FeatureFlag.define({
      key: 'feature_x',
      name: 'Feature X',
      description: 'Test feature',
      state: 'ENABLED',
      percentage: 50,
      allowedTenantIds: ['tenant-1'],
      allowedRoles: ['ADMIN'],
    });

    expect(flag.state).toBe('ENABLED');
    expect(flag.percentage).toBe(50);
    expect(flag.allowedTenantIds).toEqual(['tenant-1']);
    expect(flag.allowedRoles).toEqual(['ADMIN']);
  });

  it('rejects empty key', () => {
    expect(() => FeatureFlag.define({ key: '', name: 'Feature' })).toThrow();
  });

  it('rejects empty name', () => {
    expect(() => FeatureFlag.define({ key: 'f', name: '' })).toThrow();
  });
});

describe('FeatureFlag mutators', () => {
  it('enable()/disable() toggle state', () => {
    const flag = FeatureFlag.define({ key: 'f', name: 'Feature' });

    flag.enable();
    expect(flag.state).toBe('ENABLED');
    expect(flag.isEnabled()).toBe(true);

    flag.disable();
    expect(flag.state).toBe('DISABLED');
    expect(flag.isEnabled()).toBe(false);
  });

  it('setPercentage() sets state to PERCENTAGE', () => {
    const flag = FeatureFlag.define({ key: 'f', name: 'Feature' });

    flag.setPercentage(30);
    expect(flag.state).toBe('PERCENTAGE');
    expect(flag.percentage).toBe(30);
    expect(flag.isEnabled()).toBe(true);
  });

  it('setPercentage() rejects out of range', () => {
    const flag = FeatureFlag.define({ key: 'f', name: 'Feature' });
    expect(() => flag.setPercentage(-1)).toThrow();
    expect(() => flag.setPercentage(101)).toThrow();
  });

  it('addAllowedTenant() adds without duplicating', () => {
    const flag = FeatureFlag.define({ key: 'f', name: 'Feature' });

    flag.addAllowedTenant('tenant-1');
    flag.addAllowedTenant('tenant-1');
    expect(flag.allowedTenantIds).toEqual(['tenant-1']);
  });

  it('removeAllowedTenant() removes the tenant', () => {
    const flag = FeatureFlag.define({ key: 'f', name: 'Feature', allowedTenantIds: ['t1', 't2'] });

    flag.removeAllowedTenant('t1');
    expect(flag.allowedTenantIds).toEqual(['t2']);
  });

  it('addAllowedRole() adds without duplicating', () => {
    const flag = FeatureFlag.define({ key: 'f', name: 'Feature' });

    flag.addAllowedRole('ADMIN');
    flag.addAllowedRole('ADMIN');
    expect(flag.allowedRoles).toEqual(['ADMIN']);
  });
});

describe('FeatureFlag.reconstitute', () => {
  it('rebuilds from persisted state', () => {
    const id = EntityId.create();
    const flag = FeatureFlag.reconstitute({
      id,
      key: 'new_dashboard',
      name: 'New Dashboard',
      state: 'PERCENTAGE',
      percentage: 25,
      allowedTenantIds: ['t1', 't2'],
      allowedRoles: ['ADMIN'],
    });

    expect(flag.id.equals(id)).toBe(true);
    expect(flag.state).toBe('PERCENTAGE');
    expect(flag.percentage).toBe(25);
    expect(flag.allowedTenantIds).toEqual(['t1', 't2']);
  });
});
