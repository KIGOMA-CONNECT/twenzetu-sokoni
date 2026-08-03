import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { JobRequisitionClosedEvent, JobRequisitionCloseReason } from './events/job-requisition-closed.event';
import { JobRequisitionOpenedEvent } from './events/job-requisition-opened.event';

export type JobRequisitionStatus = 'OPEN' | 'CLOSED';

interface OpenJobRequisitionProps {
  readonly tenantId: TenantId;
  readonly positionId: EntityId;
  readonly title: string;
  readonly headcount: number;
}

interface ReconstituteJobRequisitionProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly positionId: EntityId;
  readonly title: string;
  readonly headcount: number;
  readonly status: JobRequisitionStatus;
  readonly closeReason: JobRequisitionCloseReason | null;
}

// A requisition is the demand signal ("we need N people in this Position")
// that Applications get submitted against. Closing is one-way terminal
// (matches PayrollPeriod/Employee's terminal-state precedent) — a
// re-opened hiring need is a new requisition, not a reopened old one.
export class JobRequisition extends AggregateRoot<EntityId> {
  private _status: JobRequisitionStatus;
  private _closeReason: JobRequisitionCloseReason | null;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _positionId: EntityId,
    private readonly _title: string,
    private readonly _headcount: number,
    status: JobRequisitionStatus,
    closeReason: JobRequisitionCloseReason | null,
  ) {
    super(id);
    this._status = status;
    this._closeReason = closeReason;
  }

  public static open(props: OpenJobRequisitionProps): JobRequisition {
    Guard.assert(Guard.againstEmptyString(props.title, 'title'));
    Guard.assert(Guard.inRange(props.headcount, 1, 1000, 'headcount'));

    const requisition = new JobRequisition(
      EntityId.create(),
      props.tenantId,
      props.positionId,
      props.title,
      props.headcount,
      'OPEN',
      null,
    );
    requisition.addDomainEvent(
      new JobRequisitionOpenedEvent(
        requisition.id.toValue(),
        props.tenantId.value,
        props.positionId.toValue(),
        props.headcount,
      ),
    );
    return requisition;
  }

  public static reconstitute(props: ReconstituteJobRequisitionProps): JobRequisition {
    return new JobRequisition(
      props.id,
      props.tenantId,
      props.positionId,
      props.title,
      props.headcount,
      props.status,
      props.closeReason,
    );
  }

  public close(reason: JobRequisitionCloseReason): void {
    this.assertOpen('close');
    this._status = 'CLOSED';
    this._closeReason = reason;
    this.addDomainEvent(new JobRequisitionClosedEvent(this.id.toValue(), this._tenantId.value, reason));
  }

  public assertOpen(action: string): void {
    if (this._status !== 'OPEN') {
      throw new BusinessRuleViolationException(`Cannot ${action}: job requisition is already CLOSED.`);
    }
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get positionId(): EntityId {
    return this._positionId;
  }

  public get title(): string {
    return this._title;
  }

  public get headcount(): number {
    return this._headcount;
  }

  public get status(): JobRequisitionStatus {
    return this._status;
  }

  public get closeReason(): JobRequisitionCloseReason | null {
    return this._closeReason;
  }
}
