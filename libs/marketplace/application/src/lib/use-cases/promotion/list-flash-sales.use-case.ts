import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IFlashSaleRepository } from '@afri-market/marketplace-domain';
import { FLASH_SALE_REPOSITORY } from '../../tokens';

@Injectable()
export class ListFlashSalesUseCase {
  constructor(@Inject(FLASH_SALE_REPOSITORY) private readonly repo: IFlashSaleRepository) {}

  public async execute(tenantId: string, opts?: { status?: string; limit?: number; offset?: number }) {
    return this.repo.findByTenant(tenantId, opts);
  }
}
