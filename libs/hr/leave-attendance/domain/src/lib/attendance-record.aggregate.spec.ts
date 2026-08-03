import { BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { AttendanceRecord } from './attendance-record.aggregate';

const TENANT_ID = TenantId.create('3f2504e0-4f89-41d3-9a0c-0305e82c3301').getValue();

describe('AttendanceRecord.clockIn', () => {
  it('starts PRESENT with no clockOutTime/hoursWorked', () => {
    const record = AttendanceRecord.clockIn({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      date: new Date('2026-07-14'),
      clockInTime: new Date('2026-07-14T08:00:00.000Z'),
    });

    expect(record.status).toBe('PRESENT');
    expect(record.clockOutTime).toBeNull();
    expect(record.hoursWorked).toBeNull();
  });
});

describe('AttendanceRecord.clockOut', () => {
  it('computes hoursWorked from the clock-in/out times', () => {
    const record = AttendanceRecord.clockIn({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      date: new Date('2026-07-14'),
      clockInTime: new Date('2026-07-14T08:00:00.000Z'),
    });

    record.clockOut(new Date('2026-07-14T16:30:00.000Z'));

    expect(record.hoursWorked).toBe(8.5);
    expect(record.clockOutTime).not.toBeNull();
  });

  it('rejects clocking out before clocking in', () => {
    const record = AttendanceRecord.clockIn({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      date: new Date('2026-07-14'),
      clockInTime: new Date('2026-07-14T08:00:00.000Z'),
    });

    expect(() => record.clockOut(new Date('2026-07-14T07:00:00.000Z'))).toThrow(
      BusinessRuleViolationException,
    );
  });

  it('rejects clocking out twice', () => {
    const record = AttendanceRecord.clockIn({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      date: new Date('2026-07-14'),
      clockInTime: new Date('2026-07-14T08:00:00.000Z'),
    });
    record.clockOut(new Date('2026-07-14T16:00:00.000Z'));

    expect(() => record.clockOut(new Date('2026-07-14T17:00:00.000Z'))).toThrow(
      BusinessRuleViolationException,
    );
  });

  it('rejects clocking out a manually-recorded (never clocked-in) record', () => {
    const record = AttendanceRecord.recordManual({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      date: new Date('2026-07-14'),
      status: 'ABSENT',
    });

    expect(() => record.clockOut(new Date('2026-07-14T17:00:00.000Z'))).toThrow(
      BusinessRuleViolationException,
    );
  });
});

describe('AttendanceRecord.recordManual', () => {
  it('creates a record with the given status and no clock times', () => {
    const record = AttendanceRecord.recordManual({
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      date: new Date('2026-07-14'),
      status: 'ABSENT',
    });

    expect(record.status).toBe('ABSENT');
    expect(record.clockInTime).toBeNull();
  });
});

describe('AttendanceRecord.reconstitute', () => {
  it('rebuilds a record from persisted state', () => {
    const id = EntityId.create();

    const record = AttendanceRecord.reconstitute({
      id,
      tenantId: TENANT_ID,
      employeeId: EntityId.create(),
      date: new Date('2026-07-14'),
      clockInTime: new Date('2026-07-14T08:00:00.000Z'),
      clockOutTime: new Date('2026-07-14T16:00:00.000Z'),
      status: 'PRESENT',
      hoursWorked: 8,
    });

    expect(record.id.equals(id)).toBe(true);
    expect(record.hoursWorked).toBe(8);
  });
});
