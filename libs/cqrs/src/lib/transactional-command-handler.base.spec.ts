import { ICommand, IDomainEvent, IEventBus, ITransactionContext, IUnitOfWork } from '@abms/kernel';
import { AuditLogEntryInput, IAuditLogger } from '@abms/audit';
import { ICurrentUserProvider } from '@abms/core-security';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
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
  public constructor(
    unitOfWork: IUnitOfWork,
    eventBus: IEventBus,
    tenantContext: AsyncLocalTenantContextStore,
    currentUser: ICurrentUserProvider,
    auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContext, currentUser, auditLogger);
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

function fakeTenantContext(tenantId: string | undefined = 'tenant-a'): AsyncLocalTenantContextStore {
  return { getTenantId: () => tenantId } as unknown as AsyncLocalTenantContextStore;
}

function fakeCurrentUser(userId: string | undefined = 'user-a'): ICurrentUserProvider {
  return { getCurrentUserId: () => userId };
}

function fakeAuditLogger(): jest.Mocked<IAuditLogger> {
  return { log: jest.fn().mockResolvedValue(undefined) };
}

describe('TransactionalCommandHandler', () => {
  it('runs handle() inside a unit-of-work transaction', async () => {
    const ctx = fakeTransactionContext();
    const unitOfWork = fakeUnitOfWork(ctx);
    const eventBus = fakeEventBus();
    const handler = new TestCommandHandler(
      unitOfWork,
      eventBus,
      fakeTenantContext(),
      fakeCurrentUser(),
      fakeAuditLogger(),
    );

    const result = await handler.execute(new TestCommand());

    expect(unitOfWork.withTransaction).toHaveBeenCalledTimes(1);
    expect(result).toBe('handled');
  });

  it('publishes events added to the transaction context only after a successful commit', async () => {
    const ctx = fakeTransactionContext();
    const unitOfWork = fakeUnitOfWork(ctx);
    const eventBus = fakeEventBus();
    const handler = new TestCommandHandler(
      unitOfWork,
      eventBus,
      fakeTenantContext(),
      fakeCurrentUser(),
      fakeAuditLogger(),
    );

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
    const handler = new TestCommandHandler(
      unitOfWork,
      eventBus,
      fakeTenantContext(),
      fakeCurrentUser(),
      fakeAuditLogger(),
    );

    await handler.execute(new TestCommand(false));

    expect(eventBus.publishAll).not.toHaveBeenCalled();
  });

  it('never publishes events when the transaction fails', async () => {
    const ctx = fakeTransactionContext();
    const unitOfWork = fakeUnitOfWork(ctx, true);
    const eventBus = fakeEventBus();
    const handler = new TestCommandHandler(
      unitOfWork,
      eventBus,
      fakeTenantContext(),
      fakeCurrentUser(),
      fakeAuditLogger(),
    );

    await expect(handler.execute(new TestCommand(true))).rejects.toThrow('transaction failed');

    expect(eventBus.publishAll).not.toHaveBeenCalled();
  });

  it('logs a SUCCESS audit entry with tenantId/userId/correlationId after a successful command', async () => {
    const ctx = fakeTransactionContext();
    const unitOfWork = fakeUnitOfWork(ctx);
    const auditLogger = fakeAuditLogger();
    const handler = new TestCommandHandler(
      unitOfWork,
      fakeEventBus(),
      fakeTenantContext('tenant-a'),
      fakeCurrentUser('user-a'),
      auditLogger,
    );

    await handler.execute(new TestCommand());

    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining<Partial<AuditLogEntryInput>>({
        commandName: 'TestCommand',
        tenantId: 'tenant-a',
        userId: 'user-a',
        correlationId: 'corr-1',
        outcome: 'SUCCESS',
      }),
    );
  });

  it('logs a FAILURE audit entry with the error message when the transaction fails, then re-throws', async () => {
    const ctx = fakeTransactionContext();
    const unitOfWork = fakeUnitOfWork(ctx, true);
    const auditLogger = fakeAuditLogger();
    const handler = new TestCommandHandler(
      unitOfWork,
      fakeEventBus(),
      fakeTenantContext(),
      fakeCurrentUser(),
      auditLogger,
    );

    await expect(handler.execute(new TestCommand())).rejects.toThrow('transaction failed');

    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining<Partial<AuditLogEntryInput>>({
        outcome: 'FAILURE',
        errorMessage: 'transaction failed',
      }),
    );
  });

  it('logs tenantId/userId as null when no tenant/user context is active', async () => {
    const ctx = fakeTransactionContext();
    const unitOfWork = fakeUnitOfWork(ctx);
    const auditLogger = fakeAuditLogger();
    const noTenantContext = { getTenantId: () => undefined } as unknown as AsyncLocalTenantContextStore;
    const noCurrentUser: ICurrentUserProvider = { getCurrentUserId: () => undefined };
    const handler = new TestCommandHandler(
      unitOfWork,
      fakeEventBus(),
      noTenantContext,
      noCurrentUser,
      auditLogger,
    );

    await handler.execute(new TestCommand());

    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining<Partial<AuditLogEntryInput>>({ tenantId: null, userId: null }),
    );
  });

  it('does not let an audit-logging failure mask the real command result (fail-open)', async () => {
    const ctx = fakeTransactionContext();
    const unitOfWork = fakeUnitOfWork(ctx);
    const auditLogger: jest.Mocked<IAuditLogger> = {
      log: jest.fn().mockRejectedValue(new Error('audit sink unavailable')),
    };
    const handler = new TestCommandHandler(
      unitOfWork,
      fakeEventBus(),
      fakeTenantContext(),
      fakeCurrentUser(),
      auditLogger,
    );

    const result = await handler.execute(new TestCommand());

    expect(result).toBe('handled');
  });
});
