import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import {
  BenefitEnrollmentReadModel,
  ListBenefitEnrollmentsForEmployeeQuery,
} from '@abms/hr-compensation-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toBenefitEnrollmentReadModel } from './to-read-model';
import { TypeOrmBenefitEnrollmentRepository } from '../repositories/typeorm-benefit-enrollment.repository';

@Injectable()
@QueryHandler(ListBenefitEnrollmentsForEmployeeQuery)
export class ListBenefitEnrollmentsForEmployeeHandler extends TransactionalQueryHandler<
  ListBenefitEnrollmentsForEmployeeQuery,
  BenefitEnrollmentReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListBenefitEnrollmentsForEmployeeQuery,
    ctx: ITransactionContext,
  ): Promise<BenefitEnrollmentReadModel[]> {
    const repository = new TypeOrmBenefitEnrollmentRepository(getEntityManager(ctx));
    const enrollments = await repository.findAllByEmployee(
      currentTenantId(this.tenantContext),
      EntityId.create(query.employeeId),
    );
    return enrollments.map(toBenefitEnrollmentReadModel);
  }
}
