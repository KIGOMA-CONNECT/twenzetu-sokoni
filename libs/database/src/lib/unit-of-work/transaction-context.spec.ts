import { IDomainEvent } from '@afri-market/kernel';
import type { EntityManager } from 'typeorm';
import { TypeOrmTransactionContext } from './transaction-context';

function fakeEvent(eventType: string): IDomainEvent {
  return { eventId: crypto.randomUUID(), occurredOn: new Date(), eventType };
}

describe('TypeOrmTransactionContext', () => {
  it('exposes the given manager and a generated correlation id', () => {
    const manager = {} as EntityManager;

    const ctx = new TypeOrmTransactionContext(manager);

    expect(ctx.manager).toBe(manager);
    expect(ctx.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates a distinct correlation id per instance', () => {
    const manager = {} as EntityManager;

    const a = new TypeOrmTransactionContext(manager);
    const b = new TypeOrmTransactionContext(manager);

    expect(a.correlationId).not.toBe(b.correlationId);
  });

  it('starts with no buffered events', () => {
    const ctx = new TypeOrmTransactionContext({} as EntityManager);

    expect(ctx.events).toHaveLength(0);
  });

  it('accumulates events added during the transaction, in order', () => {
    const ctx = new TypeOrmTransactionContext({} as EntityManager);

    ctx.addEvent(fakeEvent('first'));
    ctx.addEvent(fakeEvent('second'));

    expect(ctx.events.map((e) => e.eventType)).toEqual(['first', 'second']);
  });
});
