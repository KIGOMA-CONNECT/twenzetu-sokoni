export interface IDomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly eventName: string;
  readonly aggregateId: string;
  readonly tenantId?: string;
}
