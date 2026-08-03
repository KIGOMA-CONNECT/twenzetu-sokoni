import { CurrencyCode, EntityId, Money, TenantId } from '@abms/kernel';
import { Trip } from './trip.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();
const TZS = CurrencyCode.create('TZS').getValue();

function request(): Trip {
  return Trip.request({
    tenantId: TENANT_ID,
    customerPhone: '0712000000',
    pickupLocation: 'Kariakoo',
    destinationLocation: 'Kigoma',
    requestChannel: 'USSD',
  });
}

describe('Trip', () => {
  it('requests in REQUESTED status and emits an event', () => {
    const trip = request();

    expect(trip.status).toBe('REQUESTED');
    expect(trip.domainEvents).toHaveLength(1);
  });

  it('assign() transitions to ASSIGNED with driver/vehicle set', () => {
    const trip = request();
    const driverId = EntityId.create();
    const vehicleId = EntityId.create();

    trip.assign(driverId, vehicleId);

    expect(trip.status).toBe('ASSIGNED');
    expect(trip.driverId).toBe(driverId);
    expect(trip.vehicleId).toBe(vehicleId);
    expect(trip.domainEvents).toHaveLength(2);
  });

  it('rejects assign() on a trip that is not REQUESTED', () => {
    const trip = request();
    trip.assign(EntityId.create(), EntityId.create());

    expect(() => trip.assign(EntityId.create(), EntityId.create())).toThrow();
  });

  it('start() requires ASSIGNED and transitions to IN_PROGRESS', () => {
    const trip = request();

    expect(() => trip.start()).toThrow();

    trip.assign(EntityId.create(), EntityId.create());
    trip.start();

    expect(trip.status).toBe('IN_PROGRESS');
  });

  it('complete() computes commission and driver earning via basis points', () => {
    const trip = request();
    trip.assign(EntityId.create(), EntityId.create());
    trip.start();

    const fare = Money.create('10000', TZS).getValue();
    trip.complete(fare, 1000); // 10%

    expect(trip.status).toBe('COMPLETED');
    expect(trip.fareAmount?.amount).toBe('10000');
    expect(trip.commissionAmount?.amount).toBe('1000.0000');
    expect(trip.driverEarning?.amount).toBe('9000.0000');
  });

  it('rejects complete() on a trip that is not IN_PROGRESS', () => {
    const trip = request();

    expect(() => trip.complete(Money.create('10000', TZS).getValue(), 1000)).toThrow();
  });

  it('cancel() is allowed from REQUESTED or ASSIGNED but not after', () => {
    const requestedTrip = request();
    requestedTrip.cancel('Customer changed their mind');
    expect(requestedTrip.status).toBe('CANCELLED');
    expect(requestedTrip.cancelledReason).toBe('Customer changed their mind');

    const assignedTrip = request();
    assignedTrip.assign(EntityId.create(), EntityId.create());
    assignedTrip.cancel('Driver unavailable');
    expect(assignedTrip.status).toBe('CANCELLED');

    const inProgressTrip = request();
    inProgressTrip.assign(EntityId.create(), EntityId.create());
    inProgressTrip.start();
    expect(() => inProgressTrip.cancel('Too late')).toThrow();
  });
});
