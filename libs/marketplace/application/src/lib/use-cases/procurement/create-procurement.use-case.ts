import { Inject, Injectable } from '@nestjs/common';
import { EntityId, TenantId } from '@afri-market/kernel';
import { CustomProcurement, ICustomProcurementRepository } from '@afri-market/marketplace-domain';
import { PROCUREMENT_REPOSITORY } from '../../tokens';
import { CreateCustomProcurementCommand } from '../../commands/create-custom-procurement.command';

@Injectable()
export class CreateProcurementUseCase {
  constructor(
    @Inject(PROCUREMENT_REPOSITORY)
    private readonly procurementRepo: ICustomProcurementRepository,
  ) {}

  public async execute(
    tenantId: string,
    command: CreateCustomProcurementCommand,
  ): Promise<{ procurementId: string }> {
    const procurement = CustomProcurement.create({
      tenantId: TenantId.create(tenantId),
      customerId: EntityId.from(command.customerId),
      productQuery: command.productQuery,
      specifications: command.specifications,
    });

    await this.procurementRepo.save(procurement);

    return { procurementId: procurement.id.value };
  }
}
