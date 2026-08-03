import { AUDIT_LOGGER, IAuditLogger } from '@abms/audit';
import { CURRENT_USER_PROVIDER, ICurrentUserProvider } from '@abms/core-security';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { TenantAwareUnitOfWork } from '@abms/database';
import {
  BusinessRuleViolationException,
  EntityId,
  ITransactionContext,
  NotFoundDomainException,
} from '@abms/kernel';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { EnrollInCourseCommand, EnrollInCourseResult } from '@abms/hr-learning-application';
import { CourseEnrollment } from '@abms/hr-learning-domain';
import { CommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmCourseEnrollmentRepository } from '../repositories/typeorm-course-enrollment.repository';
import { TypeOrmCourseRepository } from '../repositories/typeorm-course.repository';

@Injectable()
@CommandHandler(EnrollInCourseCommand)
export class EnrollInCourseHandler extends TransactionalCommandHandler<
  EnrollInCourseCommand,
  EnrollInCourseResult
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    eventBus: EventBusAdapter,
    private readonly tenantContextStore: AsyncLocalTenantContextStore,
    @Inject(CURRENT_USER_PROVIDER) currentUser: ICurrentUserProvider,
    @Inject(AUDIT_LOGGER) auditLogger: IAuditLogger,
  ) {
    super(unitOfWork, eventBus, tenantContextStore, currentUser, auditLogger);
  }

  protected async handle(
    command: EnrollInCourseCommand,
    ctx: ITransactionContext,
  ): Promise<EnrollInCourseResult> {
    const manager = getEntityManager(ctx);
    const courseRepository = new TypeOrmCourseRepository(manager);
    const enrollmentRepository = new TypeOrmCourseEnrollmentRepository(manager);
    const tenantId = currentTenantId(this.tenantContextStore);

    const courseId = EntityId.create(command.courseId);
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundDomainException('Course', command.courseId);
    }
    course.assertActive('enroll an employee');

    const employeeId = EntityId.create(command.employeeId);
    const existing = await enrollmentRepository.findActiveByEmployeeAndCourse(tenantId, employeeId, courseId);
    if (existing) {
      throw new BusinessRuleViolationException('Employee is already enrolled in this course.');
    }

    const enrollment = CourseEnrollment.enroll({
      tenantId,
      employeeId,
      courseId,
      enrolledDate: new Date(command.enrolledDate),
    });

    await enrollmentRepository.save(enrollment);
    for (const event of enrollment.domainEvents) {
      ctx.addEvent(event);
    }

    return { id: enrollment.id.toValue() };
  }
}
