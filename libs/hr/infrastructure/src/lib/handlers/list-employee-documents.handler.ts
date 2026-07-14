import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { EmployeeDocumentReadModel, ListEmployeeDocumentsQuery } from '@abms/hr-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toEmployeeDocumentReadModel } from './to-read-model';
import { TypeOrmEmployeeDocumentRepository } from '../repositories/typeorm-employee-document.repository';

@Injectable()
@QueryHandler(ListEmployeeDocumentsQuery)
export class ListEmployeeDocumentsHandler extends TransactionalQueryHandler<
  ListEmployeeDocumentsQuery,
  EmployeeDocumentReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    query: ListEmployeeDocumentsQuery,
    ctx: ITransactionContext,
  ): Promise<EmployeeDocumentReadModel[]> {
    const repository = new TypeOrmEmployeeDocumentRepository(getEntityManager(ctx));
    const documents = await repository.findByEmployeeId(
      currentTenantId(this.tenantContext),
      EntityId.create(query.employeeId),
    );
    return documents.map(toEmployeeDocumentReadModel);
  }
}
