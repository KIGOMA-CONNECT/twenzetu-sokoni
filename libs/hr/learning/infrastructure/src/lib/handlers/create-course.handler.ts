import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CreateCourseCommand, CreateCourseResult } from '@abms/hr-learning-application';
import { Course } from '@abms/hr-learning-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmCourseRepository } from '../repositories/typeorm-course.repository';

@Injectable()
@CommandHandler(CreateCourseCommand)
export class CreateCourseHandler extends TransactionalCommandHandler<CreateCourseCommand, CreateCourseResult> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: CreateCourseCommand, ctx: ITransactionContext): Promise<CreateCourseResult> {
    const repository = new TypeOrmCourseRepository(getEntityManager(ctx));
    const tenantId = currentTenantId(this.tenantContextStore);

    const course = Course.create({
      tenantId,
      title: command.title,
      description: command.description ?? null,
      durationHours: command.durationHours,
      category: command.category,
    });

    await repository.save(course);
    for (const event of course.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: course.id.toValue() };
  }
}
