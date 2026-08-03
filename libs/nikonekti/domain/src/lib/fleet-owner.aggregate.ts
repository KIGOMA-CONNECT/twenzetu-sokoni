import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { FleetOwnerRegisteredEvent } from './events/fleet-owner-registered.event';
import { FleetOwnerSuspendedEvent } from './events/fleet-owner-suspended.event';
import { FleetOwnerVerificationUpgradedEvent } from './events/fleet-owner-verification-upgraded.event';
import { VerificationLevel } from './events/driver-verification-upgraded.event';

export type FleetOwnerStatus = 'ACTIVE' | 'SUSPENDED';

const VERIFICATION_ORDER: readonly VerificationLevel[] = ['UNVERIFIED', 'PHONE_VERIFIED', 'KYC_VERIFIED'];

interface RegisterFleetOwnerProps {
  readonly tenantId: TenantId;
  readonly businessName: string;
  readonly phone: string;
}

interface ReconstituteFleetOwnerProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly businessName: string;
  readonly phone: string;
  readonly verificationLevel: VerificationLevel;
  readonly status: FleetOwnerStatus;
}

// A registered entity that owns one or more Vehicles (corporate transport
// clients, agri-logistics operators, or an individual owning several
// vehicles) — structurally mirrors Driver's verification-tier shape, since
// both are risk-gated parties in the same NIKONEKTI trust model.
export class FleetOwner extends AggregateRoot<EntityId> {
  private _verificationLevel: VerificationLevel;
  private _status: FleetOwnerStatus;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _businessName: string,
    private readonly _phone: string,
    verificationLevel: VerificationLevel,
    status: FleetOwnerStatus,
  ) {
    super(id);
    this._verificationLevel = verificationLevel;
    this._status = status;
  }

  public static register(props: RegisterFleetOwnerProps): FleetOwner {
    Guard.assert(Guard.againstEmptyString(props.businessName, 'businessName'));
    Guard.assert(Guard.againstEmptyString(props.phone, 'phone'));

    const owner = new FleetOwner(
      EntityId.create(),
      props.tenantId,
      props.businessName,
      props.phone,
      'UNVERIFIED',
      'ACTIVE',
    );
    owner.addDomainEvent(new FleetOwnerRegisteredEvent(owner.id.toValue(), props.tenantId.value));
    return owner;
  }

  public static reconstitute(props: ReconstituteFleetOwnerProps): FleetOwner {
    return new FleetOwner(
      props.id,
      props.tenantId,
      props.businessName,
      props.phone,
      props.verificationLevel,
      props.status,
    );
  }

  public upgradeVerification(level: VerificationLevel): void {
    const currentIndex = VERIFICATION_ORDER.indexOf(this._verificationLevel);
    const targetIndex = VERIFICATION_ORDER.indexOf(level);
    if (targetIndex <= currentIndex) {
      throw new BusinessRuleViolationException(
        `Cannot upgrade verification: "${level}" is not forward of the current level "${this._verificationLevel}".`,
      );
    }
    this._verificationLevel = level;
    this.addDomainEvent(
      new FleetOwnerVerificationUpgradedEvent(this.id.toValue(), this._tenantId.value, level),
    );
  }

  public suspend(): void {
    if (this._status === 'SUSPENDED') {
      throw new BusinessRuleViolationException('Fleet owner is already suspended.');
    }
    this._status = 'SUSPENDED';
    this.addDomainEvent(new FleetOwnerSuspendedEvent(this.id.toValue(), this._tenantId.value));
  }

  public assertActive(action: string): void {
    if (this._status !== 'ACTIVE') {
      throw new BusinessRuleViolationException(`Cannot ${action}: fleet owner is not active.`);
    }
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get businessName(): string {
    return this._businessName;
  }

  public get phone(): string {
    return this._phone;
  }

  public get verificationLevel(): VerificationLevel {
    return this._verificationLevel;
  }

  public get status(): FleetOwnerStatus {
    return this._status;
  }
}
