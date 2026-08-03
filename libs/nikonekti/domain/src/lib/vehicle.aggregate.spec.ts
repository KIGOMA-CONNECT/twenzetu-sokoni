import { EntityId, TenantId } from '@abms/kernel';
import { Vehicle } from './vehicle.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function register(): Vehicle {
  return Vehicle.register({
    tenantId: TENANT_ID,
    fleetOwnerId: EntityId.create(),
    plateNumber: 'T123ABC',
    category: 'CAR',
    capacityKg: 400,
  });
}

describe('Vehicle', () => {
  it('registers as ACTIVE and emits an event', () => {
    const vehicle = register();

    expect(vehicle.status).toBe('ACTIVE');
    expect(vehicle.domainEvents).toHaveLength(1);
  });

  it('allows a null fleetOwnerId for an independently operated vehicle', () => {
    const vehicle = Vehicle.register({
      tenantId: TENANT_ID,
      fleetOwnerId: null,
      plateNumber: 'T999XYZ',
      category: 'MOTORCYCLE',
      capacityKg: 50,
    });

    expect(vehicle.fleetOwnerId).toBeNull();
  });

  it('deactivate() is not idempotent', () => {
    const vehicle = register();

    vehicle.deactivate();

    expect(vehicle.status).toBe('INACTIVE');
    expect(() => vehicle.deactivate()).toThrow();
  });

  it('assertActive() throws once deactivated', () => {
    const vehicle = register();
    vehicle.deactivate();

    expect(() => vehicle.assertActive('assign to a trip')).toThrow();
  });
});
