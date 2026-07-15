import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { LeaveRequestApprovedEvent } from './events/leave-request-approved.event';
import { LeaveRequestCancelledEvent } from './events/leave-request-cancelled.event';
import { LeaveRequestRejectedEvent } from './events/leave-request-rejected.event';
import { LeaveRequestSubmittedEvent } from './events/leave-request-submitted.event';

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface SubmitLeaveRequestProps {
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly leaveTypeId: EntityId;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly numberOfDays: number;
  readonly reason: string | null;
}

interface ReconstituteLeaveRequestProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly employeeId: EntityId;
  readonly leaveTypeId: EntityId;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly numberOfDays: number;
  readonly reason: string | null;
  readonly status: LeaveRequestStatus;
  readonly decidedByUserId: string | null;
  readonly decidedAt: Date | null;
  readonly comment: string | null;
  readonly version: number;
}

// v1 is a single-step approve/reject decision, not routed through the
// Workflow Engine — see ADR-0009 for why multi-step chains are deferred
// rather than wired in now.
export class LeaveRequest extends AggregateRoot<EntityId> {
  private _status: LeaveRequestStatus;
  private _decidedByUserId: string | null;
  private _decidedAt: Date | null;
  private _comment: string | null;
  private _version: number;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _employeeId: EntityId,
    private readonly _leaveTypeId: EntityId,
    private readonly _startDate: Date,
    private readonly _endDate: Date,
    private readonly _numberOfDays: number,
    private readonly _reason: string | null,
    status: LeaveRequestStatus,
    decidedByUserId: string | null,
    decidedAt: Date | null,
    comment: string | null,
    version: number,
  ) {
    super(id);
    this._status = status;
    this._decidedByUserId = decidedByUserId;
    this._decidedAt = decidedAt;
    this._comment = comment;
    this._version = version;
  }

  public static submit(props: SubmitLeaveRequestProps): LeaveRequest {
    Guard.assert(Guard.inRange(props.numberOfDays, 0.5, 365, 'numberOfDays'));
    if (props.startDate.getTime() > props.endDate.getTime()) {
      throw new BusinessRuleViolationException('startDate must not be after endDate.');
    }

    const request = new LeaveRequest(
      EntityId.create(),
      props.tenantId,
      props.employeeId,
      props.leaveTypeId,
      props.startDate,
      props.endDate,
      props.numberOfDays,
      props.reason,
      'PENDING',
      null,
      null,
      null,
      1,
    );
    request.addDomainEvent(
      new LeaveRequestSubmittedEvent(
        request.id.toValue(),
        props.tenantId.value,
        props.employeeId.toValue(),
        props.leaveTypeId.toValue(),
      ),
    );
    return request;
  }

  public static reconstitute(props: ReconstituteLeaveRequestProps): LeaveRequest {
    return new LeaveRequest(
      props.id,
      props.tenantId,
      props.employeeId,
      props.leaveTypeId,
      props.startDate,
      props.endDate,
      props.numberOfDays,
      props.reason,
      props.status,
      props.decidedByUserId,
      props.decidedAt,
      props.comment,
      props.version,
    );
  }

  private assertPending(action: string): void {
    if (this._status !== 'PENDING') {
      throw new BusinessRuleViolationException(
        `Cannot ${action}: leave request is already ${this._status}.`,
      );
    }
  }

  public approve(approvedByUserId: string, comment: string | null): void {
    this.assertPending('approve');
    this._status = 'APPROVED';
    this._decidedByUserId = approvedByUserId;
    this._decidedAt = new Date();
    this._comment = comment;
    this.addDomainEvent(
      new LeaveRequestApprovedEvent(this.id.toValue(), this._tenantId.value, approvedByUserId),
    );
    this._version += 1;
  }

  public reject(rejectedByUserId: string, comment: string | null): void {
    this.assertPending('reject');
    this._status = 'REJECTED';
    this._decidedByUserId = rejectedByUserId;
    this._decidedAt = new Date();
    this._comment = comment;
    this.addDomainEvent(
      new LeaveRequestRejectedEvent(this.id.toValue(), this._tenantId.value, rejectedByUserId),
    );
    this._version += 1;
  }

  public cancel(): void {
    this.assertPending('cancel');
    this._status = 'CANCELLED';
    this.addDomainEvent(new LeaveRequestCancelledEvent(this.id.toValue(), this._tenantId.value));
    this._version += 1;
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

  public get startDate(): Date {
    return this._startDate;
  }

  public get endDate(): Date {
    return this._endDate;
  }

  public get numberOfDays(): number {
    return this._numberOfDays;
  }

  public get reason(): string | null {
    return this._reason;
  }

  public get status(): LeaveRequestStatus {
    return this._status;
  }

  public get decidedByUserId(): string | null {
    return this._decidedByUserId;
  }

  public get decidedAt(): Date | null {
    return this._decidedAt;
  }

  public get comment(): string | null {
    return this._comment;
  }

  public get version(): number {
    return this._version;
  }
}
