export interface IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType: string;
}

export abstract class DomainEventBase implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;

  protected constructor(public readonly eventType: string) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
  }
}
