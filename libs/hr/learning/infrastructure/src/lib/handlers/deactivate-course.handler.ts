import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { DeactivateCourseCommand } from '@abms/hr-learning-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmCourseRepository } from '../repositories/typeorm-course.repository';

@Injectable()
@CommandHandler(DeactivateCourseCommand)
export class DeactivateCourseHandler extends TransactionalCommandHandler<DeactivateCourseCommand, void> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: DeactivateCourseCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmCourseRepository(getEntityManager(ctx));

    const course = await repository.findById(EntityId.create(command.courseId));
    if (!course) {
      throw new NotFoundDomainException('Course', command.courseId);
    }

    course.deactivate();

    await repository.save(course);
    for (const event of course.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
