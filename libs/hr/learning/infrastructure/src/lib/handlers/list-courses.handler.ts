import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { CourseReadModel, ListCoursesQuery } from '@abms/hr-learning-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toCourseReadModel } from './to-read-model';
import { TypeOrmCourseRepository } from '../repositories/typeorm-course.repository';

@Injectable()
@QueryHandler(ListCoursesQuery)
export class ListCoursesHandler extends TransactionalQueryHandler<ListCoursesQuery, CourseReadModel[]> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(_query: ListCoursesQuery, ctx: ITransactionContext): Promise<CourseReadModel[]> {
    const repository = new TypeOrmCourseRepository(getEntityManager(ctx));
    const courses = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return courses.map(toCourseReadModel);
  }
}
