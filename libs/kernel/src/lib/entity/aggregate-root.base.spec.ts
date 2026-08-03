import { DomainEvent } from '../events/domain-event.base';
import { EntityId } from '../identity/entity-id';
import { AggregateRoot } from './aggregate-root.base';

class TestCreatedEvent extends DomainEvent {
  public constructor(aggregateId: string) {
    super(aggregateId);
  }

  public get eventName(): string {
    return 'test.created';
  }
}

class TestAggregate extends AggregateRoot {
  public constructor(id: EntityId) {
    super(id);
  }

  public static create(): TestAggregate {
    const aggregate = new TestAggregate(EntityId.create());
    aggregate.addDomainEvent(new TestCreatedEvent(aggregate.id.toValue()));
    return aggregate;
  }
}

describe('AggregateRoot', () => {
  it('starts with no buffered domain events', () => {
    const aggregate = new TestAggregate(EntityId.create());

    expect(aggregate.domainEvents).toHaveLength(0);
  });

  it('buffers domain events added by the aggregate', () => {
    const aggregate = TestAggregate.create();

    expect(aggregate.domainEvents).toHaveLength(1);
    expect(aggregate.domainEvents[0].eventName).toBe('test.created');
  });

  it('clears buffered domain events', () => {
    const aggregate = TestAggregate.create();

    aggregate.clearEvents();

    expect(aggregate.domainEvents).toHaveLength(0);
  });

  it('domainEvents is not directly mutable by consumers', () => {
    const aggregate = TestAggregate.create();
    const events = aggregate.domainEvents as unknown[];

    expect(() => events.push({})).toThrow();
  });
});
