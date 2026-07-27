import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ICouponRepository } from '@afri-market/marketplace-domain';
import { COUPON_REPOSITORY } from '../../tokens';

@Injectable()
export class ListCouponsUseCase {
  constructor(@Inject(COUPON_REPOSITORY) private readonly repo: ICouponRepository) {}

  public async execute(tenantId: string, opts?: { status?: string; limit?: number; offset?: number }) {
    return this.repo.findByTenant(tenantId, opts);
  }
}
