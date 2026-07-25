import { IDomainEvent } from '../events/domain-event.interface';
import { EntityId } from '../identity/entity-id';
import { Identifier } from '../identity/identifier.base';
import { Entity } from './entity.base';

export abstract class AggregateRoot<TId extends Identifier<unknown> = EntityId> extends Entity<TId> {
  private readonly _domainEvents: IDomainEvent[] = [];

  public get domainEvents(): ReadonlyArray<IDomainEvent> {
    return Object.freeze([...this._domainEvents]);
  }

  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearEvents(): void {
    this._domainEvents.length = 0;
  }
}
