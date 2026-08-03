import { BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { LeaveRequest } from './leave-request.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

function submitRequest() {
  return LeaveRequest.submit({
    tenantId: TENANT_ID,
    employeeId: EntityId.create(),
    leaveTypeId: EntityId.create(),
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-08-05'),
    numberOfDays: 5,
    reason: 'Family trip',
  });
}

describe('LeaveRequest.submit', () => {
  it('starts PENDING at version 1', () => {
    const request = submitRequest();

    expect(request.status).toBe('PENDING');
    expect(request.version).toBe(1);
  });

  it('rejects startDate after endDate', () => {
    expect(() =>
      LeaveRequest.submit({
        tenantId: TENANT_ID,
        employeeId: EntityId.create(),
        leaveTypeId: EntityId.create(),
        startDate: new Date('2026-08-05'),
        endDate: new Date('2026-08-01'),
        numberOfDays: 5,
        reason: null,
      }),
    ).toThrow(BusinessRuleViolationException);
  });

  it('rejects zero numberOfDays', () => {
    expect(() =>
      LeaveRequest.submit({
        tenantId: TENANT_ID,
        employeeId: EntityId.create(),
        leaveTypeId: EntityId.create(),
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-01'),
        numberOfDays: 0,
        reason: null,
      }),
    ).toThrow(BusinessRuleViolationException);
  });
});

describe('LeaveRequest.approve', () => {
  it('sets status APPROVED with decision metadata', () => {
    const request = submitRequest();

    request.approve('user-manager', 'Enjoy your trip');

    expect(request.status).toBe('APPROVED');
    expect(request.decidedByUserId).toBe('user-manager');
    expect(request.comment).toBe('Enjoy your trip');
    expect(request.decidedAt).toBeInstanceOf(Date);
    expect(request.version).toBe(2);
  });

  it('rejects approving a non-PENDING request', () => {
    const request = submitRequest();
    request.approve('user-manager', null);

    expect(() => request.approve('user-manager', null)).toThrow(BusinessRuleViolationException);
  });
});

describe('LeaveRequest.reject', () => {
  it('sets status REJECTED with decision metadata', () => {
    const request = submitRequest();

    request.reject('user-manager', 'Team is short-staffed that week');

    expect(request.status).toBe('REJECTED');
    expect(request.decidedByUserId).toBe('user-manager');
  });
});

describe('LeaveRequest.cancel', () => {
  it('sets status CANCELLED', () => {
    const request = submitRequest();

    request.cancel();

    expect(request.status).toBe('CANCELLED');
  });

  it('rejects cancelling an already-decided request', () => {
    const request = submitRequest();
    request.approve('user-manager', null);

    expect(() => request.cancel()).toThrow(BusinessRuleViolationException);
  });
});

describe('LeaveRequest.reconstitute', () => {
  it('rebuilds a request from persisted state', () => {
    const id = EntityId.create();

    const request = LeaveRequest.reconstitute({
      id,
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      leaveTypeId: EntityId.create(),
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-05'),
      numberOfDays: 5,
      reason: null,
      status: 'APPROVED',
      decidedByUserId: 'user-manager',
      decidedAt: new Date('2026-07-15'),
      comment: null,
      version: 2,
    });

    expect(request.id.equals(id)).toBe(true);
    expect(request.status).toBe('APPROVED');
    expect(request.version).toBe(2);
  });
});
