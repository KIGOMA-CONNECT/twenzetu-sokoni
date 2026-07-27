import { EntityId, IRepository } from '@afri-market/kernel';
import { Coupon } from './coupon.aggregate';

export interface ICouponRepository extends IRepository<Coupon, EntityId> {
  findByCode(code: string, tenantId: string): Promise<Coupon | null>;
  findByTenant(tenantId: string, opts?: { status?: string; limit?: number; offset?: number }): Promise<{ data: Coupon[]; total: number }>;
}
