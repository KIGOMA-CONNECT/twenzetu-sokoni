import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ListLeaveTypesQuery, LeaveTypeReadModel } from '@abms/hr-leave-attendance-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toLeaveTypeReadModel } from './to-read-model';
import { TypeOrmLeaveTypeRepository } from '../repositories/typeorm-leave-type.repository';

@Injectable()
@QueryHandler(ListLeaveTypesQuery)
export class ListLeaveTypesHandler extends TransactionalQueryHandler<ListLeaveTypesQuery, LeaveTypeReadModel[]> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListLeaveTypesQuery,
    ctx: ITransactionContext,
  ): Promise<LeaveTypeReadModel[]> {
    const repository = new TypeOrmLeaveTypeRepository(getEntityManager(ctx));
    const leaveTypes = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return leaveTypes.map(toLeaveTypeReadModel);
  }
}
