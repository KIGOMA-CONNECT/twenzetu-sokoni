export interface IQueryBus {
  execute<TQuery, TResult>(query: TQuery): Promise<TResult>;
}
