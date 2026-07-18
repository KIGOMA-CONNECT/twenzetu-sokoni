import { AggregateRoot, Email, EntityId, Guard, TenantId } from '@abms/kernel';
import { CandidateRegisteredEvent } from './events/candidate-registered.event';

interface RegisterCandidateProps {
  readonly tenantId: TenantId;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: Email;
  readonly phone: string | null;
  readonly resumeUrl: string | null;
  readonly source: string | null;
}

interface ReconstituteCandidateProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: Email;
  readonly phone: string | null;
  readonly resumeUrl: string | null;
  readonly source: string | null;
}

// A Candidate is a person, not yet an Employee — deliberately independent of
// hr-domain's Employee, since a candidate may apply, be rejected, and never
// become one. Only Application.hire() ever produces a real Employee (see
// ADR-0011), and even then this Candidate record is kept as-is (recruitment
// history), not deleted or converted in place.
export class Candidate extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _firstName: string,
    private readonly _lastName: string,
    private readonly _email: Email,
    private readonly _phone: string | null,
    private readonly _resumeUrl: string | null,
    private readonly _source: string | null,
  ) {
    super(id);
  }

  public static register(props: RegisterCandidateProps): Candidate {
    Guard.assert(Guard.againstEmptyString(props.firstName, 'firstName'));
    Guard.assert(Guard.againstEmptyString(props.lastName, 'lastName'));

    const candidate = new Candidate(
      EntityId.create(),
      props.tenantId,
      props.firstName,
      props.lastName,
      props.email,
      props.phone,
      props.resumeUrl,
      props.source,
    );
    candidate.addDomainEvent(
      new CandidateRegisteredEvent(candidate.id.toValue(), props.tenantId.value, props.email.value),
    );
    return candidate;
  }

  public static reconstitute(props: ReconstituteCandidateProps): Candidate {
    return new Candidate(
      props.id,
      props.tenantId,
      props.firstName,
      props.lastName,
      props.email,
      props.phone,
      props.resumeUrl,
      props.source,
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get firstName(): string {
    return this._firstName;
  }

  public get lastName(): string {
    return this._lastName;
  }

  public get email(): Email {
    return this._email;
  }

  public get phone(): string | null {
    return this._phone;
  }

  public get resumeUrl(): string | null {
    return this._resumeUrl;
  }

  public get source(): string | null {
    return this._source;
  }
}
