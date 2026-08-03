import { DomainEvent } from '@abms/kernel';

export type VerificationLevel = 'UNVERIFIED' | 'PHONE_VERIFIED' | 'KYC_VERIFIED';

export class DriverVerificationUpgradedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly verificationLevel: VerificationLevel,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'nikonekti.driver.verification-upgraded';
  }
}
