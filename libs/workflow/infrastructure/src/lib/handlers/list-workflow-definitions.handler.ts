import { TenantAwareUnitOfWork } from '@abms/database';
import { ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { AsyncLocalTenantContextStore } from '@abms/tenancy';
import { ListWorkflowDefinitionsQuery, WorkflowDefinitionReadModel } from '@abms/workflow-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { currentTenantId } from './current-tenant-id';
import { getEntityManager } from './get-entity-manager';
import { toWorkflowDefinitionReadModel } from './to-read-model';
import { TypeOrmWorkflowDefinitionRepository } from '../repositories/typeorm-workflow-definition.repository';

@Injectable()
@QueryHandler(ListWorkflowDefinitionsQuery)
export class ListWorkflowDefinitionsHandler extends TransactionalQueryHandler<
  ListWorkflowDefinitionsQuery,
  WorkflowDefinitionReadModel[]
> {
  public constructor(
    unitOfWork: TenantAwareUnitOfWork,
    private readonly tenantContext: AsyncLocalTenantContextStore,
  ) {
    super(unitOfWork);
  }

  protected async handle(
    _query: ListWorkflowDefinitionsQuery,
    ctx: ITransactionContext,
  ): Promise<WorkflowDefinitionReadModel[]> {
    const repository = new TypeOrmWorkflowDefinitionRepository(getEntityManager(ctx));
    const definitions = await repository.findAllByTenant(currentTenantId(this.tenantContext));
    return definitions.map(toWorkflowDefinitionReadModel);
  }
}
