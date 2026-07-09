import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { DeactivateOrgUnitCommand } from '@abms/organization-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmOrgUnitRepository } from '../repositories/typeorm-org-unit.repository';

@Injectable()
@CommandHandler(DeactivateOrgUnitCommand)
export class DeactivateOrgUnitHandler extends TransactionalCommandHandler<
  DeactivateOrgUnitCommand,
  void
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork, eventBus: EventBusAdapter) {
    super(unitOfWork, eventBus);
  }

  protected async handle(command: DeactivateOrgUnitCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmOrgUnitRepository(getEntityManager(ctx));
    const orgUnitId = EntityId.create(command.orgUnitId);

    const orgUnit = await repository.findById(orgUnitId);
    if (!orgUnit) {
      throw new NotFoundDomainException('OrgUnit', command.orgUnitId);
    }

    orgUnit.deactivate();
    await repository.save(orgUnit);
  }
}
