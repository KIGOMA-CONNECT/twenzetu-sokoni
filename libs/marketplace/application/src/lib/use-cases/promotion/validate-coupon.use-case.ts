import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Coupon, ICouponRepository } from '@afri-market/marketplace-domain';
import { COUPON_REPOSITORY } from '../../tokens';

@Injectable()
export class ValidateCouponUseCase {
  constructor(@Inject(COUPON_REPOSITORY) private readonly repo: ICouponRepository) {}

  public async execute(tenantId: string, code: string, orderAmount: number): Promise<{
    valid: boolean; discount?: number; discountType?: string; message: string;
  }> {
    const coupon = await this.repo.findByCode(code, tenantId);
    if (!coupon) return { valid: false, message: 'Coupon not found' };
    if (!coupon.isValid()) return { valid: false, message: 'Coupon is expired or disabled' };
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return { valid: false, message: `Minimum order amount is ${coupon.minOrderAmount} ${coupon.currency}` };
    }
    const discount = coupon.calculateDiscount(orderAmount);
    if (discount <= 0) return { valid: false, message: 'No discount applicable' };
    return { valid: true, discount, discountType: coupon.discountType, message: 'Coupon applied' };
  }
}
