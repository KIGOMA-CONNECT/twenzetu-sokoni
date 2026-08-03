import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext } from '@abms/kernel';
import { TransactionalQueryHandler } from '@abms/cqrs';
import { GetOffboardingCaseByIdQuery, OffboardingCaseReadModel } from '@abms/hr-offboarding-application';
import { QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { toOffboardingCaseReadModel } from './to-read-model';
import { TypeOrmOffboardingCaseRepository } from '../repositories/typeorm-offboarding-case.repository';

@Injectable()
@QueryHandler(GetOffboardingCaseByIdQuery)
export class GetOffboardingCaseByIdHandler extends TransactionalQueryHandler<
  GetOffboardingCaseByIdQuery,
  OffboardingCaseReadModel | null
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork) {
    super(unitOfWork);
  }

  protected async handle(
    query: GetOffboardingCaseByIdQuery,
    ctx: ITransactionContext,
  ): Promise<OffboardingCaseReadModel | null> {
    const repository = new TypeOrmOffboardingCaseRepository(getEntityManager(ctx));
    const offboardingCase = await repository.findById(EntityId.create(query.offboardingCaseId));
    return offboardingCase ? toOffboardingCaseReadModel(offboardingCase) : null;
  }
}
