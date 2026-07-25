import { AggregateRoot, EntityId, TenantId } from '@afri-market/kernel';
import { LoyaltyTier, calculateTier } from './loyalty-tier';

export interface CreateCustomerPointsProps {
  readonly tenantId: TenantId;
  readonly customerId: EntityId;
}

export interface ReconstituteCustomerPointsProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly customerId: EntityId;
  readonly totalPoints: number;
  readonly redeemablePoints: number;
  readonly lifetimePoints: number;
  readonly tier: LoyaltyTier;
  readonly referralCode: string | undefined;
  readonly referredBy: EntityId | undefined;
  readonly totalReferrals: number;
  readonly freeDeliveriesRemaining: number;
  readonly version: number;
}

export class CustomerPoints extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _customerId: EntityId,
    private _totalPoints: number,
    private _redeemablePoints: number,
    private _lifetimePoints: number,
    private _tier: LoyaltyTier,
    private _referralCode: string | undefined,
    private _referredBy: EntityId | undefined,
    private _totalReferrals: number,
    private _freeDeliveriesRemaining: number,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateCustomerPointsProps): CustomerPoints {
    return new CustomerPoints(
      EntityId.create(), props.tenantId, props.customerId,
      0, 0, 0, 'BRONZE', undefined, undefined, 0, 0, 1,
    );
  }

  public static reconstitute(props: ReconstituteCustomerPointsProps): CustomerPoints {
    return new CustomerPoints(
      props.id, props.tenantId, props.customerId,
      props.totalPoints, props.redeemablePoints, props.lifetimePoints,
      props.tier, props.referralCode, props.referredBy,
      props.totalReferrals, props.freeDeliveriesRemaining, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get customerId(): EntityId { return this._customerId; }
  public get totalPoints(): number { return this._totalPoints; }
  public get redeemablePoints(): number { return this._redeemablePoints; }
  public get lifetimePoints(): number { return this._lifetimePoints; }
  public get tier(): LoyaltyTier { return this._tier; }
  public get referralCode(): string | undefined { return this._referralCode; }
  public get freeDeliveriesRemaining(): number { return this._freeDeliveriesRemaining; }
  public get version(): number { return this._version; }

  public earnPoints(amount: number, _reason: string): void {
    const earned = Math.floor(amount / 1000) * 10;
    this._totalPoints += earned;
    this._redeemablePoints += earned;
    this._lifetimePoints += earned;
    this._tier = calculateTier(this._lifetimePoints);
  }

  public redeemPoints(points: number): void {
    if (points > this._redeemablePoints) throw new Error('Insufficient redeemable points');
    this._redeemablePoints -= points;
  }

  public useFreeDelivery(): void {
    if (this._freeDeliveriesRemaining <= 0) throw new Error('No free deliveries remaining');
    this._freeDeliveriesRemaining -= 1;
  }

  public setReferralCode(code: string): void { this._referralCode = code; }
  public setReferredBy(referrerId: EntityId): void { this._referredBy = referrerId; }
  public incrementReferrals(): void {
    this._totalReferrals += 1;
    this._redeemablePoints += 500;
  }
}
