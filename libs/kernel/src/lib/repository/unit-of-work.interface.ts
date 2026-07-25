import { IDomainEvent } from '../events/domain-event.interface';

export interface ITransactionContext {
  readonly correlationId: string;
  readonly events: ReadonlyArray<IDomainEvent>;
  addEvent(event: IDomainEvent): void;
}

export interface IUnitOfWork {
  withTransaction<T>(work: (ctx: ITransactionContext) => Promise<T>): Promise<T>;
}
