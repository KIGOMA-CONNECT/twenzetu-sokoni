import { IDomainEvent } from '@abms/kernel';
import type { EventBus as NestEventBus } from '@nestjs/cqrs';
import { EventBusAdapter } from './event-bus.adapter';

function fakeEvent(eventName: string): IDomainEvent {
  return { eventId: eventName, occurredAt: new Date(), eventName, aggregateId: 'agg-1' };
}

describe('EventBusAdapter', () => {
  it('publish() delegates to the underlying Nest EventBus', async () => {
    const nestEventBus = { publish: jest.fn(), publishAll: jest.fn() } as unknown as NestEventBus;
    const adapter = new EventBusAdapter(nestEventBus);
    const event = fakeEvent('test.happened');

    await adapter.publish(event);

    expect(nestEventBus.publish).toHaveBeenCalledWith(event);
  });

  it('publishAll() delegates to the underlying Nest EventBus with an array copy', async () => {
    const nestEventBus = { publish: jest.fn(), publishAll: jest.fn() } as unknown as NestEventBus;
    const adapter = new EventBusAdapter(nestEventBus);
    const events = [fakeEvent('first'), fakeEvent('second')];

    await adapter.publishAll(events);

    expect(nestEventBus.publishAll).toHaveBeenCalledWith(events);
  });
});
