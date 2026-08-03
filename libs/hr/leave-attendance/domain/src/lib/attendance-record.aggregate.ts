import { AggregateRoot, BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { EmployeeClockedInEvent } from './events/employee-clocked-in.event';
import { EmployeeClockedOutEvent } from './events/employee-clocked-out.event';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';

interface ClockInProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly date: Date;
  readonly clockInTime: Date;
}

interface RecordManualAttendanceProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly date: Date;
  readonly status: AttendanceStatus;
}

interface ReconstituteAttendanceRecordProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly date: Date;
  readonly clockInTime: Date | null;
  readonly clockOutTime: Date | null;
  readonly status: AttendanceStatus;
  readonly hoursWorked: number | null;
}

export class AttendanceRecord extends AggregateRoot<EntityId> {
  private _clockOutTime: Date | null;
  private _status: AttendanceStatus;
  private _hoursWorked: number | null;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    private readonly _date: Date,
    private readonly _clockInTime: Date | null,
    clockOutTime: Date | null,
    status: AttendanceStatus,
    hoursWorked: number | null,
  ) {
    super(id);
    this._clockOutTime = clockOutTime;
    this._status = status;
    this._hoursWorked = hoursWorked;
  }

  public static clockIn(props: ClockInProps): AttendanceRecord {
    const record = new AttendanceRecord(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.date,
      props.clockInTime,
      null,
      'PRESENT',
      null,
    );
    record.addDomainEvent(
      new EmployeeClockedInEvent(record.id.toValue(), props.tenantId.value, props.employeeId.toValue()),
    );
    return record;
  }

  public static recordManual(props: RecordManualAttendanceProps): AttendanceRecord {
    return new AttendanceRecord(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.date,
      null,
      null,
      props.status,
      null,
    );
  }

  public static reconstitute(props: ReconstituteAttendanceRecordProps): AttendanceRecord {
    return new AttendanceRecord(
      props.id,
      props.tenantId,
      props.employeeId,
      props.date,
      props.clockInTime,
      props.clockOutTime,
      props.status,
      props.hoursWorked,
    );
  }

  public clockOut(clockOutTime: Date): void {
    if (!this._clockInTime) {
      throw new BusinessRuleViolationException('Cannot clock out: this record has no clock-in time.');
    }
    if (this._clockOutTime) {
      throw new BusinessRuleViolationException('Already clocked out.');
    }
    if (clockOutTime.getTime() < this._clockInTime.getTime()) {
      throw new BusinessRuleViolationException('clockOutTime must not be before clockInTime.');
    }

    this._clockOutTime = clockOutTime;
    this._hoursWorked =
      Math.round(((clockOutTime.getTime() - this._clockInTime.getTime()) / 3_600_000) * 100) / 100;
    this.addDomainEvent(
      new EmployeeClockedOutEvent(
        this.id.toValue(),
        this._tenantId.value,
        this._employeeId.toValue(),
        this._hoursWorked,
      ),
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get date(): Date {
    return this._date;
  }

  public get clockInTime(): Date | null {
    return this._clockInTime;
  }

  public get clockOutTime(): Date | null {
    return this._clockOutTime;
  }

  public get status(): AttendanceStatus {
    return this._status;
  }

  public get hoursWorked(): number | null {
    return this._hoursWorked;
  }
}
