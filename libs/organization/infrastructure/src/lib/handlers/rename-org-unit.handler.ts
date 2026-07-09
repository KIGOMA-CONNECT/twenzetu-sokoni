import { TenantAwareUnitOfWork } from '@abms/database';
import { EntityId, ITransactionContext, NotFoundDomainException } from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { RenameOrgUnitCommand } from '@abms/organization-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from './get-entity-manager';
import { TypeOrmOrgUnitRepository } from '../repositories/typeorm-org-unit.repository';

@Injectable()
@CommandHandler(RenameOrgUnitCommand)
export class RenameOrgUnitHandler extends TransactionalCommandHandler<RenameOrgUnitCommand, void> {
  public constructor(unitOfWork: TenantAwareUnitOfWork, eventBus: EventBusAdapter) {
    super(unitOfWork, eventBus);
  }

  protected async handle(command: RenameOrgUnitCommand, ctx: ITransactionContext): Promise<void> {
    const repository = new TypeOrmOrgUnitRepository(getEntityManager(ctx));
    const orgUnitId = EntityId.create(command.orgUnitId);

    const orgUnit = await repository.findById(orgUnitId);
    if (!orgUnit) {
      throw new NotFoundDomainException('OrgUnit', command.orgUnitId);
    }

    orgUnit.rename(command.newName);
    await repository.save(orgUnit);
  }
}
