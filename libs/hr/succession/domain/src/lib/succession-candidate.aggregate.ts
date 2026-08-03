import { AggregateRoot, EntityId, Guard, TenantId } from '@abms/kernel';
import { ReadinessLevel, SuccessionCandidateNominatedEvent } from './events/succession-candidate-nominated.event';
import { SuccessionCandidateReadinessUpdatedEvent } from './events/succession-candidate-readiness-updated.event';

export type { ReadinessLevel } from './events/succession-candidate-nominated.event';

interface NominateSuccessionCandidateProps {
  readonly tenantId: TenantId;
  readonly successionPlanId: EntityId;
  readonly employeeId: EntityId;
  readonly readinessLevel: ReadinessLevel;
  readonly notes: string | null;
}

interface ReconstituteSuccessionCandidateProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly successionPlanId: EntityId;
  readonly employeeId: EntityId;
  readonly readinessLevel: ReadinessLevel;
  readonly notes: string | null;
}

// One roster entry per employee per plan, enforced by the handler + a
// (non-partial) unique index — a candidate is removed via a hard delete
// (IRepository.delete), not a status transition, since "no longer a
// candidate" has no meaningful history worth retaining as a row.
export class SuccessionCandidate extends AggregateRoot<EntityId> {
  private _readinessLevel: ReadinessLevel;
  private _notes: string | null;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _successionPlanId: EntityId,
    private readonly _employeeId: EntityId,
    readinessLevel: ReadinessLevel,
    notes: string | null,
  ) {
    super(id);
    this._readinessLevel = readinessLevel;
    this._notes = notes;
  }

  public static nominate(props: NominateSuccessionCandidateProps): SuccessionCandidate {
    const candidate = new SuccessionCandidate(
      EntityId.create(),
      props.tenantId,
      props.successionPlanId,
      props.employeeId,
      props.readinessLevel,
      props.notes,
    );
    candidate.addDomainEvent(
      new SuccessionCandidateNominatedEvent(
        candidate.id.toValue(),
        props.tenantId.value,
        props.successionPlanId.toValue(),
        props.employeeId.toValue(),
        props.readinessLevel,
      ),
    );
    return candidate;
  }

  public static reconstitute(props: ReconstituteSuccessionCandidateProps): SuccessionCandidate {
    return new SuccessionCandidate(
      props.id,
      props.tenantId,
      props.successionPlanId,
      props.employeeId,
      props.readinessLevel,
      props.notes,
    );
  }

  public updateReadiness(readinessLevel: ReadinessLevel, notes?: string | null): void {
    Guard.assert(Guard.againstNullOrUndefined(readinessLevel, 'readinessLevel'));
    this._readinessLevel = readinessLevel;
    if (notes !== undefined) {
      this._notes = notes;
    }
    this.addDomainEvent(
      new SuccessionCandidateReadinessUpdatedEvent(this.id.toValue(), this._tenantId.value, readinessLevel),
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get successionPlanId(): EntityId {
    return this._successionPlanId;
  }

  public get employeeId(): EntityId {
    return this._employeeId;
  }

  public get readinessLevel(): ReadinessLevel {
    return this._readinessLevel;
  }

  public get notes(): string | null {
    return this._notes;
  }
}
