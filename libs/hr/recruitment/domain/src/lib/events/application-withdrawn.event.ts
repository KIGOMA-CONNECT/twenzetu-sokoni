import { DomainEvent } from '@abms/kernel';

export class ApplicationWithdrawnEvent extends DomainEvent {
  public constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }

  public get eventName(): string {
    return 'hr.application.withdrawn';
  }
}
