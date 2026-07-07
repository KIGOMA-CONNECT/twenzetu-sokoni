export interface ITransactionContext {
  readonly correlationId: string;
}

export interface IUnitOfWork {
  withTransaction<T>(work: (ctx: ITransactionContext) => Promise<T>): Promise<T>;
}
