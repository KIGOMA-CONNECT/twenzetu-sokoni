import { randomUUID } from 'node:crypto';
import { IDomainEvent } from './domain-event.interface';

export abstract class DomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly tenantId?: string;

  protected constructor(aggregateId: string, tenantId?: string) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.tenantId = tenantId;
  }

  public abstract get eventName(): string;
}
