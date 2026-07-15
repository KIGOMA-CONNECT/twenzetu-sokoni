import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import {
  ListLeaveRequestsForEmployeeQuery,
  LeaveRequestReadModel,
} from '@abms/hr-leave-attendance-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toLeaveRequestReadModel } from './to-read-model';
import { TypeOrmLeaveRequestRepository } from '../repositories/typeorm-leave-request.repository';

@Injectable()
@QueryHandler(ListLeaveRequestsForEmployeeQuery)
export class ListLeaveRequestsForEmployeeHandler extends TransactionalQueryHandler<
  ListLeaveRequestsForEmployeeQuery,
  LeaveRequestReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListLeaveRequestsForEmployeeQuery,
    ctx: ITransactionContext,
  ): Promise<LeaveRequestReadModel[]> {
    const repository = new TypeOrmLeaveRequestRepository(getEntityManager(ctx));
    const requests = await repository.findAllByEmployee(
      currentTenantId(this.tenantContext),
      EntityId.create(query.employeeId),
    );
    return requests.map(toLeaveRequestReadModel);
  }
}
