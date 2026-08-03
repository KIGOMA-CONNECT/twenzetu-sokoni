import { DomainEvent } from '@abms/kernel';
import { VerificationLevel } from './driver-verification-upgraded.event';

export class FleetOwnerVerificationUpgradedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly verificationLevel: VerificationLevel,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'nikonekti.fleet-owner.verification-upgraded';
  }
}
