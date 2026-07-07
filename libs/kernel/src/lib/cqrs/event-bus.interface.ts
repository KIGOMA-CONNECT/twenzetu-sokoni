import { IDomainEvent } from '../events/domain-event.interface';

export interface IEventBus {
  publish<TEvent extends IDomainEvent>(event: TEvent): Promise<void>;
  publishAll(events: ReadonlyArray<IDomainEvent>): Promise<void>;
}
