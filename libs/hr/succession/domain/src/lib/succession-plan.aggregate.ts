import { AggregateRoot, BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { SuccessionPlanClosedEvent } from './events/succession-plan-closed.event';
import { SuccessionPlanOpenedEvent } from './events/succession-plan-opened.event';

export type SuccessionPlanStatus = 'OPEN' | 'CLOSED';

interface OpenSuccessionPlanProps {
  readonly tenantId: TenantId;
  readonly positionId: EntityId;
  readonly notes: string | null;
}

interface ReconstituteSuccessionPlanProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly positionId: EntityId;
  readonly notes: string | null;
  readonly status: SuccessionPlanStatus;
}

// One OPEN plan per Position at a time, enforced by the handler + a
// partial unique index — mirrors OffboardingCase's "one active case per
// employee" pattern (ADR-0013, point 2). positionId is an opaque FK to
// Core HR's Position table (@abms/hr-domain/@abms/hr-infrastructure) — no
// TypeScript dependency on that module, matching Leave & Attendance/
// Payroll's precedent (ADR-0009/ADR-0010) rather than Recruitment's/
// Offboarding's direct-mutation exception, since nothing here needs to
// mutate the Position or Employee aggregate in the same transaction.
export class SuccessionPlan extends AggregateRoot<EntityId> {
  private _status: SuccessionPlanStatus;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _positionId: EntityId,
    private readonly _notes: string | null,
    status: SuccessionPlanStatus,
  ) {
    super(id);
    this._status = status;
  }

  public static open(props: OpenSuccessionPlanProps): SuccessionPlan {
    const plan = new SuccessionPlan(EntityId.create(), props.tenantId, props.positionId, props.notes, 'OPEN');
    plan.addDomainEvent(
      new SuccessionPlanOpenedEvent(plan.id.toValue(), props.tenantId.value, props.positionId.toValue()),
    );
    return plan;
  }

  public static reconstitute(props: ReconstituteSuccessionPlanProps): SuccessionPlan {
    return new SuccessionPlan(props.id, props.tenantId, props.positionId, props.notes, props.status);
  }

  public close(): void {
    this.assertOpen('close');
    this._status = 'CLOSED';
    this.addDomainEvent(new SuccessionPlanClosedEvent(this.id.toValue(), this._tenantId.value));
  }

  public assertOpen(action: string): void {
    if (this._status !== 'OPEN') {
      throw new BusinessRuleViolationException(`Cannot ${action}: succession plan is already CLOSED.`);
    }
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get positionId(): EntityId {
    return this._positionId;
  }

  public get notes(): string | null {
    return this._notes;
  }

  public get status(): SuccessionPlanStatus {
    return this._status;
  }
}
