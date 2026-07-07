import { IQuery } from './query.interface';

export interface IQueryBus {
  execute<TResult>(query: IQuery<TResult>): Promise<TResult>;
}
