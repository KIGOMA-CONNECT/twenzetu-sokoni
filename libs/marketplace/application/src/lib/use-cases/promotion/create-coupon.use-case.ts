import { Injectable, ConflictException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { TenantId } from '@afri-market/kernel';
import { Coupon, ICouponRepository } from '@afri-market/marketplace-domain';
import { COUPON_REPOSITORY } from '../../tokens';

@Injectable()
export class CreateCouponUseCase {
  constructor(@Inject(COUPON_REPOSITORY) private readonly repo: ICouponRepository) {}

  public async execute(tenantId: string, params: {
    code: string; discountType: string; discountValue: number;
    currency?: string; minOrderAmount?: number; maxUsageCount?: number;
    maxUsagePerUser?: number; expiresAt?: string; description?: string;
  }): Promise<{ id: string; code: string }> {
    const existing = await this.repo.findByCode(params.code, tenantId);
    if (existing) throw new ConflictException(`Coupon code ${params.code} already exists`);

    const coupon = Coupon.create({
      tenantId: TenantId.create(tenantId),
      code: params.code, discountType: params.discountType as any,
      discountValue: params.discountValue, currency: params.currency,
      minOrderAmount: params.minOrderAmount, maxUsageCount: params.maxUsageCount,
      maxUsagePerUser: params.maxUsagePerUser,
      expiresAt: params.expiresAt ? new Date(params.expiresAt) : undefined,
      description: params.description,
    });
    await this.repo.save(coupon);
    return { id: coupon.id.value, code: coupon.code };
  }
}
