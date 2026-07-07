import { IDomainEvent, ITransactionContext } from '@abms/kernel';
import { randomUUID } from 'node:crypto';
import { EntityManager } from 'typeorm';

export class TypeOrmTransactionContext implements ITransactionContext {
  public readonly correlationId: string;
  public readonly manager: EntityManager;
  private readonly _events: IDomainEvent[] = [];

  public constructor(manager: EntityManager) {
    this.manager = manager;
    this.correlationId = randomUUID();
  }

  public get events(): ReadonlyArray<IDomainEvent> {
    return this._events;
  }

  public addEvent(event: IDomainEvent): void {
    this._events.push(event);
  }
}
