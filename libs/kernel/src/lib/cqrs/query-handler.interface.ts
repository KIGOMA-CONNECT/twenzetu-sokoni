export interface IQueryHandler<TQuery = unknown, TResult = unknown> {
  execute(query: TQuery): Promise<TResult>;
}
