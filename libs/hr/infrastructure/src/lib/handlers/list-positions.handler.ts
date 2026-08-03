import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ListPositionsQuery, PositionReadModel } from '@abms/hr-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toPositionReadModel } from './to-read-model';
import { TypeOrmPositionRepository } from '../repositories/typeorm-position.repository';

@Injectable()
@QueryHandler(ListPositionsQuery)
export class ListPositionsHandler extends TransactionalQueryHandler<ListPositionsQuery, PositionReadModel[]> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListPositionsQuery,
    ctx: ITransactionContext,
  ): Promise<PositionReadModel[]> {
    const repository = new TypeOrmPositionRepository(getEntityManager(ctx));
    const positions = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return positions.map(toPositionReadModel);
  }
}
