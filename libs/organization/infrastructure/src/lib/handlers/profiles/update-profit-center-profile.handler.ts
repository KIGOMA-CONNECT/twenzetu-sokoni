import { TenantAwareUnitOfWork } from '@abms/database';
import {
  ConcurrencyDomainException,
  CurrencyCode,
  EntityId,
  ITransactionContext,
  Money,
  NotFoundDomainException,
} from '@abms/kernel';
import { EventBusAdapter, TransactionalCommandHandler } from '@abms/cqrs';
import { UpdateProfitCenterProfileCommand } from '@abms/organization-application';
import { CommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { getEntityManager } from '../get-entity-manager';
import { TypeOrmProfitCenterProfileRepository } from '../../repositories/typeorm-profit-center-profile.repository';

@Injectable()
@CommandHandler(UpdateProfitCenterProfileCommand)
export class UpdateProfitCenterProfileHandler extends TransactionalCommandHandler<
  UpdateProfitCenterProfileCommand,
  void
> {
  public constructor(unitOfWork: TenantAwareUnitOfWork, eventBus: EventBusAdapter) {
    super(unitOfWork, eventBus);
  }

  protected async handle(command: UpdateProfitCenterProfileCommand, ctx: ITransactionContext): Promise<void> {
    const manager = getEntityManager(ctx);
    const profitCenterProfileRepository = new TypeOrmProfitCenterProfileRepository(manager);

    const orgUnitId = EntityId.create(command.orgUnitId);
    const profile = await profitCenterProfileRepository.findByOrgUnitId(orgUnitId);
    if (!profile) {
      throw new NotFoundDomainException('ProfitCenterProfile', command.orgUnitId);
    }

    if (profile.version !== command.expectedVersion) {
      throw new ConcurrencyDomainException('ProfitCenterProfile', command.orgUnitId);
    }

    profile.update({
      revenueTarget: Money.create(
        command.revenueTargetAmount,
        CurrencyCode.create(command.revenueTargetCurrency).getValue(),
      ).getValue(),
      reportingCurrency: CurrencyCode.create(command.reportingCurrency).getValue(),
      glAccountCode: command.glAccountCode,
    });

    await profitCenterProfileRepository.save(profile);
  }
}
