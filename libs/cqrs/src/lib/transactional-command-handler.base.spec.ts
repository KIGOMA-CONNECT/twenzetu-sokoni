import { ICommand, IDomainEvent, IEventBus, ITransactionContext, IUnitOfWork } from '@abms/kernel';
import { TransactionalCommandHandler } from './transactional-command-handler.base';

class TestCommand implements ICommand<string> {
  public readonly _resultType?: string;

  public constructor(public readonly shouldEmitEvent = false) {}
}

class TestEvent implements IDomainEvent {
  public readonly eventId = 'evt-1';
  public readonly occurredAt = new Date();
  public readonly eventName = 'test.happened';
  public readonly aggregateId = 'agg-1';
}

class TestCommandHandler extends TransactionalCommandHandler<TestCommand, string> {
  public constructor(unitOfWork: IUnitOfWork, eventBus: IEventBus) {
    super(unitOfWork, eventBus);
  }

  protected async handle(command: TestCommand, ctx: ITransactionContext): Promise<string> {
    if (command.shouldEmitEvent) {
      ctx.addEvent(new TestEvent());
    }
    return 'handled';
  }
}

function fakeTransactionContext(): ITransactionContext {
  const events: IDomainEvent[] = [];
  return {
    correlationId: 'corr-1',
    get events() {
      return events;
    },
    addEvent: (event: IDomainEvent) => {
      events.push(event);
    },
  };
}

function fakeUnitOfWork(
  ctx: ITransactionContext,
  shouldFail = false,
): IUnitOfWork & { withTransaction: jest.Mock } {
  const withTransaction = jest.fn(async (work: (ctx: ITransactionContext) => Promise<unknown>) => {
    const result = await work(ctx);
    if (shouldFail) {
      throw new Error('transaction failed');
    }
    return result;
  });
  return { withTransaction } as unknown as IUnitOfWork & { withTransaction: jest.Mock };
}

function fakeEventBus(): jest.Mocked<IEventBus> {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
    publishAll: jest.fn().mockResolvedValue(undefined),
  };
}

describe('TransactionalCommandHandler', () => {
  it('runs handle() inside a unit-of-work transaction', async () => {
    const ctx = fakeTransactionContext();
    const unitOfWork = fakeUnitOfWork(ctx);
    const eventBus = fakeEventBus();
    const handler = new TestCommandHandler(unitOfWork, eventBus);

    const result = await handler.execute(new TestCommand());

    expect(unitOfWork.withTransaction).toHaveBeenCalledTimes(1);
    expect(result).toBe('handled');
  });

  it('publishes events added to the transaction context only after a successful commit', async () => {
    const ctx = fakeTransactionContext();
    const unitOfWork = fakeUnitOfWork(ctx);
    const eventBus = fakeEventBus();
    const handler = new TestCommandHandler(unitOfWork, eventBus);

    await handler.execute(new TestCommand(true));

    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    const publishedEvents = eventBus.publishAll.mock.calls[0][0];
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0].eventName).toBe('test.happened');
  });

  it('does not call publishAll when no events were emitted', async () => {
    const ctx = fakeTransactionContext();
    const unitOfWork = fakeUnitOfWork(ctx);
    const eventBus = fakeEventBus();
    const handler = new TestCommandHandler(unitOfWork, eventBus);

    await handler.execute(new TestCommand(false));

    expect(eventBus.publishAll).not.toHaveBeenCalled();
  });

  it('never publishes events when the transaction fails', async () => {
    const ctx = fakeTransactionContext();
    const unitOfWork = fakeUnitOfWork(ctx, true);
    const eventBus = fakeEventBus();
    const handler = new TestCommandHandler(unitOfWork, eventBus);

    await expect(handler.execute(new TestCommand(true))).rejects.toThrow('transaction failed');

    expect(eventBus.publishAll).not.toHaveBeenCalled();
  });
});
