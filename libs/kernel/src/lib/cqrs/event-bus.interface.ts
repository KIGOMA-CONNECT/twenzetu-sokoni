import { IDomainEvent } from '../events/domain-event.interface';

export interface IEventBus {
  publish(event: IDomainEvent): void;
  publishAll(events: IDomainEvent[]): void;
}
