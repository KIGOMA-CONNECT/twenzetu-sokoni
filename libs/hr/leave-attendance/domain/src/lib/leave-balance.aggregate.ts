import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';

interface CreateLeaveBalanceProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly leaveTypeId: EntityId;
  readonly year: number;
  readonly allocatedDays: number;
}

interface ReconstituteLeaveBalanceProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly leaveTypeId: EntityId;
  readonly year: number;
  readonly allocatedDays: number;
  readonly usedDays: number;
}

// One row per employee/leaveType/year — the entitlement ledger a LeaveRequest
// draws against on approval. Deliberately not the same aggregate as
// LeaveRequest: many requests can debit one balance, and the balance can be
// adjusted (a manual top-up/correction) independent of any single request.
export class LeaveBalance extends AggregateRoot<EntityId> {
  private _allocatedDays: number;
  private _usedDays: number;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    private readonly _leaveTypeId: EntityId,
    private readonly _year: number,
    allocatedDays: number,
    usedDays: number,
  ) {
    super(id);
    this._allocatedDays = allocatedDays;
    this._usedDays = usedDays;
  }

  public static create(props: CreateLeaveBalanceProps): LeaveBalance {
    Guard.assert(Guard.inRange(props.allocatedDays, 0, 365, 'allocatedDays'));
    Guard.assert(Guard.inRange(props.year, 2000, 2200, 'year'));

    return new LeaveBalance(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.leaveTypeId,
      props.year,
      props.allocatedDays,
      0,
    );
  }

  public static reconstitute(props: ReconstituteLeaveBalanceProps): LeaveBalance {
    return new LeaveBalance(
      props.id,
      props.tenantId,
      props.employeeId,
      props.leaveTypeId,
      props.year,
      props.allocatedDays,
      props.usedDays,
    );
  }

  public adjustAllocation(newAllocatedDays: number): void {
    Guard.assert(Guard.inRange(newAllocatedDays, 0, 365, 'allocatedDays'));
    if (newAllocatedDays < this._usedDays) {
      throw new BusinessRuleViolationException(
        `Cannot reduce allocation to ${newAllocatedDays} days: ${this._usedDays} days are already used.`,
      );
    }
    this._allocatedDays = newAllocatedDays;
  }

  public debit(days: number): void {
    Guard.assert(Guard.inRange(days, 0.5, 365, 'days'));
    if (this._usedDays + days > this._allocatedDays) {
      throw new BusinessRuleViolationException(
        `Insufficient leave balance: ${this.remainingDays} days remaining, ${days} requested.`,
      );
    }
    this._usedDays += days;
  }

  public credit(days: number): void {
    Guard.assert(Guard.inRange(days, 0.5, 365, 'days'));
    this._usedDays = Math.max(0, this._usedDays - days);
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get leaveTypeId(): EntityId {
    return this._leaveTypeId;
  }

  public get year(): number {
    return this._year;
  }

  public get allocatedDays(): number {
    return this._allocatedDays;
  }

  public get usedDays(): number {
    return this._usedDays;
  }

  public get remainingDays(): number {
    return this._allocatedDays - this._usedDays;
  }
}
