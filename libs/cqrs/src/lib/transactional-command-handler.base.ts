import {
  ICommand,
  ICommandHandler,
  IEventBus,
  ITransactionContext,
  IUnitOfWork,
} from '@abms/kernel';
import { AuditOutcome, IAuditLogger } from '@abms/audit';
import { ICurrentUserProvider } from '@abms/core-security';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { randomUUID } from 'node:crypto';

export abstract class TransactionalCommandHandler<TCommand extends ICommand<TResult>, TResult = void>
  implements ICommandHandler<TCommand, TResult>
{
  protected constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly eventBus: IEventBus,
    private readonly tenantContext: AsyncLocalTenantContextStore,
    private readonly currentUser: ICurrentUserProvider,
    private readonly auditLogger: IAuditLogger,
  ) {}

  public async execute(command: TCommand): Promise<TResult> {
    let capturedCtx: ITransactionContext | undefined;
    const commandName = command.constructor.name;
    const tenantId = this.tenantContext.getTenantId() ?? null;
    const userId = this.currentUser.getCurrentUserId() ?? null;

    try {
      const result = await this.unitOfWork.withTransaction(async (ctx) => {
        capturedCtx = ctx;
        return this.handle(command, ctx);
      });

      if (capturedCtx && capturedCtx.events.length > 0) {
        await this.eventBus.publishAll(capturedCtx.events);
      }

      await this.logAudit(commandName, tenantId, userId, capturedCtx?.correlationId, 'SUCCESS');

      return result;
    } catch (error) {
      await this.logAudit(commandName, tenantId, userId, capturedCtx?.correlationId, 'FAILURE', error);
      throw error;
    }
  }

  protected abstract handle(command: TCommand, ctx: ITransactionContext): Promise<TResult>;

  // Audit-logging failures never mask the real command outcome — see ADR-0006's
  // fail-open decision. correlationId falls back to a fresh UUID for the rare
  // case the transaction never even started (e.g. TenantContextMissingException
  // thrown before withTransaction's callback ran).
  private async logAudit(
    commandName: string,
    tenantId: string | null,
    userId: string | null,
    correlationId: string | undefined,
    outcome: AuditOutcome,
    error?: unknown,
  ): Promise<void> {
    try {
      await this.auditLogger.log({
        commandName,
        tenantId,
        userId,
        correlationId: correlationId ?? randomUUID(),
        outcome,
        errorMessage: error instanceof Error ? error.message : error ? String(error) : null,
      });
    } catch {
      // Swallow — see comment above.
    }
  }
}
