import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { DriverRegisteredEvent } from './events/driver-registered.event';
import { DriverSuspendedEvent } from './events/driver-suspended.event';
import { DriverVerificationUpgradedEvent, VerificationLevel } from './events/driver-verification-upgraded.event';

export type { VerificationLevel } from './events/driver-verification-upgraded.event';
export type DriverStatus = 'ACTIVE' | 'SUSPENDED';

const VERIFICATION_ORDER: readonly VerificationLevel[] = ['UNVERIFIED', 'PHONE_VERIFIED', 'KYC_VERIFIED'];

interface RegisterDriverProps {
  readonly tenantId: TenantId;
  readonly fullName: string;
  readonly phone: string;
  readonly licenseNumber: string;
}

interface ReconstituteDriverProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly fullName: string;
  readonly phone: string;
  readonly licenseNumber: string;
  readonly verificationLevel: VerificationLevel;
  readonly status: DriverStatus;
}

// Risk-based payout gating per NIKONEKTI's verification-tier spec: a driver
// starts UNVERIFIED and can only move forward through PHONE_VERIFIED to
// KYC_VERIFIED (NIDA/business KYC), never skip or regress a level.
export class Driver extends AggregateRoot<EntityId> {
  private _verificationLevel: VerificationLevel;
  private _status: DriverStatus;

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _fullName: string,
    private readonly _phone: string,
    private readonly _licenseNumber: string,
    verificationLevel: VerificationLevel,
    status: DriverStatus,
  ) {
    super(id);
    this._verificationLevel = verificationLevel;
    this._status = status;
  }

  public static register(props: RegisterDriverProps): Driver {
    Guard.assert(Guard.againstEmptyString(props.fullName, 'fullName'));
    Guard.assert(Guard.againstEmptyString(props.phone, 'phone'));
    Guard.assert(Guard.againstEmptyString(props.licenseNumber, 'licenseNumber'));

    const driver = new Driver(
      EntityId.create(),
      props.tenantId,
      props.fullName,
      props.phone,
      props.licenseNumber,
      'UNVERIFIED',
      'ACTIVE',
    );
    driver.addDomainEvent(new DriverRegisteredEvent(driver.id.toValue(), props.tenantId.value));
    return driver;
  }

  public static reconstitute(props: ReconstituteDriverProps): Driver {
    return new Driver(
      props.id,
      props.tenantId,
      props.fullName,
      props.phone,
      props.licenseNumber,
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
    this.addDomainEvent(new DriverVerificationUpgradedEvent(this.id.toValue(), this._tenantId.value, level));
  }

  public suspend(): void {
    if (this._status === 'SUSPENDED') {
      throw new BusinessRuleViolationException('Driver is already suspended.');
    }
    this._status = 'SUSPENDED';
    this.addDomainEvent(new DriverSuspendedEvent(this.id.toValue(), this._tenantId.value));
  }

  public assertActive(action: string): void {
    if (this._status !== 'ACTIVE') {
      throw new BusinessRuleViolationException(`Cannot ${action}: driver is not active.`);
    }
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get fullName(): string {
    return this._fullName;
  }

  public get phone(): string {
    return this._phone;
  }

  public get licenseNumber(): string {
    return this._licenseNumber;
  }

  public get verificationLevel(): VerificationLevel {
    return this._verificationLevel;
  }

  public get status(): DriverStatus {
    return this._status;
  }
}
