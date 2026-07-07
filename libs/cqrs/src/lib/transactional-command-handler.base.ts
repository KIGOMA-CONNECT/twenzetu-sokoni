import {
  ICommand,
  ICommandHandler,
  IEventBus,
  ITransactionContext,
  IUnitOfWork,
} from '@abms/kernel';

export abstract class TransactionalCommandHandler<TCommand extends ICommand<TResult>, TResult = void>
  implements ICommandHandler<TCommand, TResult>
{
  protected constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly eventBus: IEventBus,
  ) {}

  public async execute(command: TCommand): Promise<TResult> {
    let capturedCtx: ITransactionContext | undefined;

    const result = await this.unitOfWork.withTransaction(async (ctx) => {
      capturedCtx = ctx;
      return this.handle(command, ctx);
    });

    if (capturedCtx && capturedCtx.events.length > 0) {
      await this.eventBus.publishAll(capturedCtx.events);
    }

    return result;
  }

  protected abstract handle(command: TCommand, ctx: ITransactionContext): Promise<TResult>;
}
