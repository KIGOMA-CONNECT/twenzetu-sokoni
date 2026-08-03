import { IDomainEvent, IEventBus } from '@abms/kernel';
import { EventBus as NestEventBus } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EventBusAdapter implements IEventBus {
  public constructor(private readonly nestEventBus: NestEventBus) {}

  public async publish<TEvent extends IDomainEvent>(event: TEvent): Promise<void> {
    this.nestEventBus.publish(event);
  }

  public async publishAll(events: ReadonlyArray<IDomainEvent>): Promise<void> {
    this.nestEventBus.publishAll([...events]);
  }
}
