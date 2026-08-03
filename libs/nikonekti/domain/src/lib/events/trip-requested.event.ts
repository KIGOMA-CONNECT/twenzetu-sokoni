import { DomainEvent } from '@abms/kernel';

export type TripRequestChannel = 'APP' | 'USSD' | 'WEB' | 'AGENT';

export class TripRequestedEvent extends DomainEvent {
  public constructor(
    aggregateId: string,
    tenantId: string,
    public readonly requestChannel: TripRequestChannel,
  ) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'nikonekti.trip.requested';
  }
}
