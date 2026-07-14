import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { GetWorkflowInstanceByIdQuery, WorkflowInstanceReadModel } from '@abms/workflow-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { toWorkflowInstanceReadModel } from './to-read-model';
import { TypeOrmWorkflowInstanceRepository } from '../repositories/typeorm-workflow-instance.repository';

@Injectable()
@QueryHandler(GetWorkflowInstanceByIdQuery)
export class GetWorkflowInstanceByIdHandler extends TransactionalQueryHandler<
  GetWorkflowInstanceByIdQuery,
  WorkflowInstanceReadModel | null
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetWorkflowInstanceByIdQuery,
    ctx: ITransactionContext,
  ): Promise<WorkflowInstanceReadModel | null> {
    const repository = new TypeOrmWorkflowInstanceRepository(getEntityManager(ctx));
    const instance = await repository.findById(EntityId.create(query.workflowInstanceId));
    return instance ? toWorkflowInstanceReadModel(instance) : null;
  }
}
