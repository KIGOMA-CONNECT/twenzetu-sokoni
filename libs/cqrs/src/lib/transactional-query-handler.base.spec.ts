import { IQuery, ITransactionContext, IUnitOfWork } from '@abms/kernel';
import { TransactionalQueryHandler } from './transactional-query-handler.base';

class TestQuery implements IQuery<string> {
  public readonly _resultType?: string;
}

class TestQueryHandler extends TransactionalQueryHandler<TestQuery, string> {
  public constructor(unitOfWork: IUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(): Promise<string> {
    return 'read-result';
  }
}

function fakeTransactionContext(): ITransactionContext {
  return { correlationId: 'corr-1', events: [], addEvent: jest.fn() };
}

function fakeUnitOfWork(ctx: ITransactionContext): IUnitOfWork & { withTransaction: jest.Mock } {
  const withTransaction = jest.fn(async (work: (ctx: ITransactionContext) => Promise<unknown>) =>
    work(ctx),
  );
  return { withTransaction } as unknown as IUnitOfWork & { withTransaction: jest.Mock };
}

describe('TransactionalQueryHandler', () => {
  it('runs handle() inside a unit-of-work transaction and returns its result', async () => {
    const unitOfWork = fakeUnitOfWork(fakeTransactionContext());
    const handler = new TestQueryHandler(unitOfWork);

    const result = await handler.execute(new TestQuery());

    expect(unitOfWork.withTransaction).toHaveBeenCalledTimes(1);
    expect(result).toBe('read-result');
  });

  it('propagates a failure from the unit of work', async () => {
    const unitOfWork = {
      withTransaction: jest.fn().mockRejectedValue(new Error('transaction failed')),
    } as unknown as IUnitOfWork;
    const handler = new TestQueryHandler(unitOfWork);

    await expect(handler.execute(new TestQuery())).rejects.toThrow('transaction failed');
  });
});
