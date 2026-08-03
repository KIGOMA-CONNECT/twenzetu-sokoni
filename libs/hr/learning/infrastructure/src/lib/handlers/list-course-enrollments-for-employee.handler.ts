import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CourseEnrollmentReadModel, ListCourseEnrollmentsForEmployeeQuery } from '@abms/hr-learning-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toCourseEnrollmentReadModel } from './to-read-model';
import { TypeOrmCourseEnrollmentRepository } from '../repositories/typeorm-course-enrollment.repository';

@Injectable()
@QueryHandler(ListCourseEnrollmentsForEmployeeQuery)
export class ListCourseEnrollmentsForEmployeeHandler extends TransactionalQueryHandler<
  ListCourseEnrollmentsForEmployeeQuery,
  CourseEnrollmentReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListCourseEnrollmentsForEmployeeQuery,
    ctx: ITransactionContext,
  ): Promise<CourseEnrollmentReadModel[]> {
    const repository = new TypeOrmCourseEnrollmentRepository(getEntityManager(ctx));
    const enrollments = await repository.findAllByEmployee(
      currentTenantId(this.tenantContext),
      EntityId.create(query.employeeId),
    );
    return enrollments.map(toCourseEnrollmentReadModel);
  }
}
