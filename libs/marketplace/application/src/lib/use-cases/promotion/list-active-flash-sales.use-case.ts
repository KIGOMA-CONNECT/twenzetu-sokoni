import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IFlashSaleRepository } from '@afri-market/marketplace-domain';
import { FLASH_SALE_REPOSITORY } from '../../tokens';

@Injectable()
export class ListActiveFlashSalesUseCase {
  constructor(@Inject(FLASH_SALE_REPOSITORY) private readonly repo: IFlashSaleRepository) {}

  public async execute(tenantId: string) {
    return this.repo.findActive(tenantId);
  }
}
