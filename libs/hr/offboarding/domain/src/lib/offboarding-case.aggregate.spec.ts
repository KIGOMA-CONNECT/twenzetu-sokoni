import { EntityId, TenantId } from '@abms/kernel';
import { OffboardingCase } from './offboarding-case.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('OffboardingCase', () => {
  it('initiates in INITIATED status and emits an event', () => {
    const offboardingCase = OffboardingCase.initiate({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      exitReason: 'RESIGNATION',
      lastWorkingDay: new Date('2026-08-15'),
    });

    expect(offboardingCase.status).toBe('INITIATED');
    expect(offboardingCase.domainEvents).toHaveLength(1);
  });

  it('complete() transitions to COMPLETED and emits an event', () => {
    const offboardingCase = OffboardingCase.initiate({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      exitReason: 'RESIGNATION',
      lastWorkingDay: new Date('2026-08-15'),
    });

    offboardingCase.complete();

    expect(offboardingCase.status).toBe('COMPLETED');
    expect(offboardingCase.domainEvents).toHaveLength(2);
  });

  it('cancel() transitions to CANCELLED and emits an event', () => {
    const offboardingCase = OffboardingCase.initiate({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      exitReason: 'END_OF_CONTRACT',
      lastWorkingDay: new Date('2026-08-15'),
    });

    offboardingCase.cancel();

    expect(offboardingCase.status).toBe('CANCELLED');
    expect(offboardingCase.domainEvents).toHaveLength(2);
  });

  it('complete() is not idempotent', () => {
    const offboardingCase = OffboardingCase.initiate({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      exitReason: 'RESIGNATION',
      lastWorkingDay: new Date('2026-08-15'),
    });
    offboardingCase.complete();

    expect(() => offboardingCase.complete()).toThrow();
  });

  it('cancel() throws once already completed', () => {
    const offboardingCase = OffboardingCase.initiate({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      exitReason: 'RESIGNATION',
      lastWorkingDay: new Date('2026-08-15'),
    });
    offboardingCase.complete();

    expect(() => offboardingCase.cancel()).toThrow();
  });
});
