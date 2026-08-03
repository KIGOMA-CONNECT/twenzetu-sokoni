import { IQuery, IQueryHandler, ITransactionContext, IUnitOfWork } from '@abms/kernel';

export abstract class TransactionalQueryHandler<TQuery extends IQuery<TResult>, TResult>
  implements IQueryHandler<TQuery, TResult>
{
  protected constructor(private readonly unitOfWork: IUnitOfWork) {}

  public execute(query: TQuery): Promise<TResult> {
    return this.unitOfWork.withTransaction((ctx) => this.handle(query, ctx));
  }

  protected abstract handle(query: TQuery, ctx: ITransactionContext): Promise<TResult>;
}
