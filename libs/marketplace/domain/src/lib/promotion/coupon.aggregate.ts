import { AggregateRoot, EntityId, TenantId } from '@afri-market/kernel';

export type DiscountType = 'percentage' | 'fixed';
export type CouponStatus = 'ACTIVE' | 'EXPIRED' | 'DISABLED';

export interface CreateCouponProps {
  readonly tenantId: TenantId;
  readonly code: string;
  readonly discountType: DiscountType;
  readonly discountValue: number;
  readonly currency?: string;
  readonly minOrderAmount?: number;
  readonly maxUsageCount?: number;
  readonly maxUsagePerUser?: number;
  readonly expiresAt?: Date;
  readonly description?: string;
}

export interface ReconstituteCouponProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly code: string;
  readonly discountType: DiscountType;
  readonly discountValue: number;
  readonly currency: string;
  readonly status: CouponStatus;
  readonly usageCount: number;
  readonly minOrderAmount: number | undefined;
  readonly maxUsageCount: number | undefined;
  readonly maxUsagePerUser: number | undefined;
  readonly expiresAt: Date | undefined;
  readonly description: string | undefined;
  readonly version: number;
}

export class Coupon extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _code: string,
    private readonly _discountType: DiscountType,
    private readonly _discountValue: number,
    private readonly _currency: string,
    private _status: CouponStatus,
    private _usageCount: number,
    private readonly _minOrderAmount: number | undefined,
    private readonly _maxUsageCount: number | undefined,
    private readonly _maxUsagePerUser: number | undefined,
    private readonly _expiresAt: Date | undefined,
    private readonly _description: string | undefined,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateCouponProps): Coupon {
    return new Coupon(
      EntityId.create(), props.tenantId, props.code.toUpperCase(),
      props.discountType, props.discountValue, props.currency || 'TZS',
      'ACTIVE', 0, props.minOrderAmount,
      props.maxUsageCount, props.maxUsagePerUser,
      props.expiresAt, props.description, 1,
    );
  }

  public static reconstitute(props: ReconstituteCouponProps): Coupon {
    return new Coupon(
      props.id, props.tenantId, props.code, props.discountType,
      props.discountValue, props.currency, props.status,
      props.usageCount, props.minOrderAmount, props.maxUsageCount,
      props.maxUsagePerUser, props.expiresAt, props.description, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get code(): string { return this._code; }
  public get discountType(): DiscountType { return this._discountType; }
  public get discountValue(): number { return this._discountValue; }
  public get currency(): string { return this._currency; }
  public get status(): CouponStatus { return this._status; }
  public get usageCount(): number { return this._usageCount; }
  public get minOrderAmount(): number | undefined { return this._minOrderAmount; }
  public get maxUsageCount(): number | undefined { return this._maxUsageCount; }
  public get maxUsagePerUser(): number | undefined { return this._maxUsagePerUser; }
  public get expiresAt(): Date | undefined { return this._expiresAt; }
  public get description(): string | undefined { return this._description; }
  public get version(): number { return this._version; }

  public isValid(): boolean {
    if (this._status !== 'ACTIVE') return false;
    if (this._expiresAt && this._expiresAt < new Date()) return false;
    if (this._maxUsageCount && this._usageCount >= this._maxUsageCount) return false;
    return true;
  }

  public calculateDiscount(orderAmount: number): number {
    if (!this.isValid()) return 0;
    if (this._minOrderAmount && orderAmount < this._minOrderAmount) return 0;
    if (this._discountType === 'percentage') {
      return Math.round(orderAmount * (this._discountValue / 100));
    }
    return Math.min(this._discountValue, orderAmount);
  }

  public recordUsage(): void {
    this._usageCount += 1;
    if (this._maxUsageCount && this._usageCount >= this._maxUsageCount) {
      this._status = 'EXPIRED';
    }
  }

  public disable(): void { this._status = 'DISABLED'; }
  public enable(): void { this._status = 'ACTIVE'; }

  public toDto() {
    return {
      id: this.id.value,
      code: this._code,
      discountType: this._discountType,
      discountValue: this._discountValue,
      currency: this._currency,
      status: this._status,
      usageCount: this._usageCount,
      minOrderAmount: this._minOrderAmount,
      maxUsageCount: this._maxUsageCount,
      maxUsagePerUser: this._maxUsagePerUser,
      expiresAt: this._expiresAt,
      description: this._description,
    };
  }
}
