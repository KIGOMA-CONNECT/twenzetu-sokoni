import { AggregateRoot, BusinessRuleViolationException, EntityId, TenantId } from '@abms/kernel';
import { ApplicationHiredEvent } from './events/application-hired.event';
import { ApplicationRejectedEvent } from './events/application-rejected.event';
import { ApplicationSubmittedEvent } from './events/application-submitted.event';
import { ApplicationWithdrawnEvent } from './events/application-withdrawn.event';

export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEWING'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

const TERMINAL_STATUSES: readonly ApplicationStatus[] = ['HIRED', 'REJECTED', 'WITHDRAWN'];

interface SubmitApplicationProps {
  readonly tenantId: TenantId;
  readonly candidateId: EntityId;
  readonly jobRequisitionId: EntityId;
}

interface ReconstituteApplicationProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly candidateId: EntityId;
  readonly jobRequisitionId: EntityId;
  readonly status: ApplicationStatus;
  readonly decisionNotes: string | null;
}

// The pipeline a Candidate travels through against one JobRequisition.
// Non-terminal stages (APPLIED -> SCREENING -> INTERVIEWING -> OFFERED) only
// move forward in that exact order — no skipping stages, no going back.
// reject()/withdraw() are the two ways out short of hire(), valid from any
// non-terminal stage. v1 deliberately does not emit a distinct event per
// intermediate stage advance (screening/interviewing/offered) — only the
// business-meaningful milestones (submitted, hired, rejected, withdrawn) are
// published; see ADR-0011.
export class Application extends AggregateRoot<EntityId> {
  private _status: ApplicationStatus;
  private _decisionNotes: string | null;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _candidateId: EntityId,
    private readonly _jobRequisitionId: EntityId,
    status: ApplicationStatus,
    decisionNotes: string | null,
  ) {
    super(id);
    this._status = status;
    this._decisionNotes = decisionNotes;
  }

  public static submit(props: SubmitApplicationProps): Application {
    const application = new Application(
      EntityId.create(),
      props.tenantId,
      props.candidateId,
      props.jobRequisitionId,
      'APPLIED',
      null,
    );
    application.addDomainEvent(
      new ApplicationSubmittedEvent(
        application.id.toValue(),
        props.tenantId.value,
        props.candidateId.toValue(),
        props.jobRequisitionId.toValue(),
      ),
    );
    return application;
  }

  public static reconstitute(props: ReconstituteApplicationProps): Application {
    return new Application(
      props.id,
      props.tenantId,
      props.candidateId,
      props.jobRequisitionId,
      props.status,
      props.decisionNotes,
    );
  }

  private assertStageTransition(from: ApplicationStatus, action: string): void {
    if (this._status !== from) {
      throw new BusinessRuleViolationException(
        `Cannot ${action}: application must be ${from} (currently ${this._status}).`,
      );
    }
  }

  public advanceToScreening(): void {
    this.assertStageTransition('APPLIED', 'advance to screening');
    this._status = 'SCREENING';
  }

  public advanceToInterviewing(): void {
    this.assertStageTransition('SCREENING', 'advance to interviewing');
    this._status = 'INTERVIEWING';
  }

  public makeOffer(): void {
    this.assertStageTransition('INTERVIEWING', 'make an offer');
    this._status = 'OFFERED';
  }

  public hire(): void {
    this.assertStageTransition('OFFERED', 'hire');
    this._status = 'HIRED';
    this.addDomainEvent(
      new ApplicationHiredEvent(this.id.toValue(), this._tenantId.value, this._candidateId.toValue()),
    );
  }

  public reject(reason: string | null): void {
    if (TERMINAL_STATUSES.includes(this._status)) {
      throw new BusinessRuleViolationException(
        `Cannot reject: application is already ${this._status}.`,
      );
    }
    this._status = 'REJECTED';
    this._decisionNotes = reason;
    this.addDomainEvent(new ApplicationRejectedEvent(this.id.toValue(), this._tenantId.value, reason));
  }

  public withdraw(): void {
    if (TERMINAL_STATUSES.includes(this._status)) {
      throw new BusinessRuleViolationException(
        `Cannot withdraw: application is already ${this._status}.`,
      );
    }
    this._status = 'WITHDRAWN';
    this.addDomainEvent(new ApplicationWithdrawnEvent(this.id.toValue(), this._tenantId.value));
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get candidateId(): EntityId {
    return this._candidateId;
  }

  public get jobRequisitionId(): EntityId {
    return this._jobRequisitionId;
  }

  public get status(): ApplicationStatus {
    return this._status;
  }

  public get decisionNotes(): string | null {
    return this._decisionNotes;
  }
}
