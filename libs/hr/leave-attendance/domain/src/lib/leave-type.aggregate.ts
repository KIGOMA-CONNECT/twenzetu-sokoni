import { AggregateRoot, EntityId, Guard, TenantId } from '@abms/kernel';
import { LeaveTypeCreatedEvent } from './events/leave-type-created.event';

interface CreateLeaveTypeProps {
  readonly tenantId: TenantId;
  readonly code: string;
  readonly name: string;
  readonly defaultDaysPerYear: number;
  readonly requiresApproval: boolean;
}

interface ReconstituteLeaveTypeProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly code: string;
  readonly name: string;
  readonly defaultDaysPerYear: number;
  readonly requiresApproval: boolean;
  readonly isActive: boolean;
}

export class LeaveType extends AggregateRoot<EntityId> {
  private _name: string;
  private _defaultDaysPerYear: number;
  private _requiresApproval: boolean;
  private _isActive: boolean;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _code: string,
    name: string,
    defaultDaysPerYear: number,
    requiresApproval: boolean,
    isActive: boolean,
  ) {
    super(id);
    this._name = name;
    this._defaultDaysPerYear = defaultDaysPerYear;
    this._requiresApproval = requiresApproval;
    this._isActive = isActive;
  }

  public static create(props: CreateLeaveTypeProps): LeaveType {
    Guard.assert(Guard.againstEmptyString(props.code, 'code'));
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    Guard.assert(Guard.inRange(props.defaultDaysPerYear, 0, 365, 'defaultDaysPerYear'));

    const leaveType = new LeaveType(
      EntityId.create(),
      props.tenantId,
      props.code,
      props.name,
      props.defaultDaysPerYear,
      props.requiresApproval,
      true,
    );
    leaveType.addDomainEvent(
      new LeaveTypeCreatedEvent(leaveType.id.toValue(), props.tenantId.value, props.code),
    );
    return leaveType;
  }

  public static reconstitute(props: ReconstituteLeaveTypeProps): LeaveType {
    return new LeaveType(
      props.id,
      props.tenantId,
      props.code,
      props.name,
      props.defaultDaysPerYear,
      props.requiresApproval,
      props.isActive,
    );
  }

  public rename(name: string): void {
    Guard.assert(Guard.againstEmptyString(name, 'name'));
    this._name = name;
  }

  public updateDefaultDaysPerYear(days: number): void {
    Guard.assert(Guard.inRange(days, 0, 365, 'defaultDaysPerYear'));
    this._defaultDaysPerYear = days;
  }

  public updateRequiresApproval(requiresApproval: boolean): void {
    this._requiresApproval = requiresApproval;
  }

  public deactivate(): void {
    this._isActive = false;
  }

  public activate(): void {
    this._isActive = true;
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get code(): string {
    return this._code;
  }

  public get name(): string {
    return this._name;
  }

  public get defaultDaysPerYear(): number {
    return this._defaultDaysPerYear;
  }

  public get requiresApproval(): boolean {
    return this._requiresApproval;
  }

  public get isActive(): boolean {
    return this._isActive;
  }
}
