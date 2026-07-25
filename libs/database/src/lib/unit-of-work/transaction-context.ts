import { IDomainEvent, ITransactionContext } from '@afri-market/kernel';
import { EntityManager } from 'typeorm';

export class TypeOrmTransactionContext implements ITransactionContext {
  public readonly correlationId: string;
  private readonly _events: IDomainEvent[] = [];

  constructor(public readonly manager: EntityManager) {
    this.correlationId = crypto.randomUUID();
  }

  public get events(): ReadonlyArray<IDomainEvent> {
    return Object.freeze([...this._events]);
  }

  public addEvent(event: IDomainEvent): void {
    this._events.push(event);
  }
}
