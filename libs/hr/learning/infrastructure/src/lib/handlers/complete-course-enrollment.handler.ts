import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CompleteCourseEnrollmentCommand } from '@abms/hr-learning-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmCourseEnrollmentRepository } from '../repositories/typeorm-course-enrollment.repository';

@Injectable()
@CommandHandler(CompleteCourseEnrollmentCommand)
export class CompleteCourseEnrollmentHandler extends TransactionalCommandHandler<
  CompleteCourseEnrollmentCommand,
  void
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(command: CompleteCourseEnrollmentCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmCourseEnrollmentRepository(getEntityManager(ctx));

    const enrollment = await repository.findById(EntityId.create(command.courseEnrollmentId));
    if (!enrollment) {
      throw new NotFoundDomainException('CourseEnrollment', command.courseEnrollmentId);
    }

    enrollment.complete(new Date(command.completedDate), command.score ?? null);

    await repository.save(enrollment);
    for (const event of enrollment.domainEvents) {
      ctx.addEvent(event);
    }
  }
}
