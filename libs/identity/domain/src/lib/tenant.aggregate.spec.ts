import { BusinessRuleViolationException, EntityId } from '@abms/kernel';
import { Tenant } from './tenant.aggregate';

describe('Tenant.create', () => {
  it('defaults to ACTIVE status', () => {
    const tenant = Tenant.create({ name: 'Afribiz Holdings Ltd' });

    expect(tenant.name).toBe('Afribiz Holdings Ltd');
    expect(tenant.status).toBe('ACTIVE');
  });

  it('rejects an empty name', () => {
    expect(() => Tenant.create({ name: '' })).toThrow(BusinessRuleViolationException);
  });
});

describe('Tenant mutators', () => {
  it('rename() updates the name', () => {
    const tenant = Tenant.create({ name: 'Afribiz Holdings Ltd' });

    tenant.rename('Afribiz Group Ltd');

    expect(tenant.name).toBe('Afribiz Group Ltd');
  });

  it('rename() rejects an empty name', () => {
    const tenant = Tenant.create({ name: 'Afribiz Holdings Ltd' });

    expect(() => tenant.rename('')).toThrow(BusinessRuleViolationException);
  });

  it('suspend()/reactivate() toggle status', () => {
    const tenant = Tenant.create({ name: 'Afribiz Holdings Ltd' });

    tenant.suspend();
    expect(tenant.status).toBe('SUSPENDED');

    tenant.reactivate();
    expect(tenant.status).toBe('ACTIVE');
  });
});

describe('Tenant.reconstitute', () => {
  it('rebuilds a tenant from persisted state', () => {
    const id = EntityId.create();

    const tenant = Tenant.reconstitute({ id, name: 'Afribiz Holdings Ltd', status: 'SUSPENDED' });

    expect(tenant.id.equals(id)).toBe(true);
    expect(tenant.status).toBe('SUSPENDED');
  });
});
