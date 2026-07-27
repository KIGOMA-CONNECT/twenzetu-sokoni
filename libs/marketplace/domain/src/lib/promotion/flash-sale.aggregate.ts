import { AggregateRoot, EntityId, TenantId } from '@afri-market/kernel';

export type FlashSaleStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';

export interface CreateFlashSaleProps {
  readonly tenantId: TenantId;
  readonly productId: EntityId;
  readonly discountPercent: number;
  readonly originalPrice: number;
  readonly salePrice: number;
  readonly currency?: string;
  readonly maxQuantity: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly description?: string;
}

export interface ReconstituteFlashSaleProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly productId: EntityId;
  readonly discountPercent: number;
  readonly originalPrice: number;
  readonly salePrice: number;
  readonly currency: string;
  readonly status: FlashSaleStatus;
  readonly totalQuantity: number;
  readonly soldQuantity: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly description: string | undefined;
  readonly version: number;
}

export class FlashSale extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _productId: EntityId,
    private readonly _discountPercent: number,
    private readonly _originalPrice: number,
    private readonly _salePrice: number,
    private readonly _currency: string,
    private _status: FlashSaleStatus,
    private readonly _totalQuantity: number,
    private _soldQuantity: number,
    private readonly _startsAt: Date,
    private readonly _endsAt: Date,
    private readonly _description: string | undefined,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateFlashSaleProps): FlashSale {
    return new FlashSale(
      EntityId.create(), props.tenantId, props.productId,
      props.discountPercent, props.originalPrice, props.salePrice,
      props.currency || 'TZS', 'SCHEDULED', props.maxQuantity, 0,
      props.startsAt, props.endsAt, props.description, 1,
    );
  }

  public static reconstitute(props: ReconstituteFlashSaleProps): FlashSale {
    return new FlashSale(
      props.id, props.tenantId, props.productId,
      props.discountPercent, props.originalPrice, props.salePrice,
      props.currency, props.status, props.totalQuantity,
      props.soldQuantity, props.startsAt, props.endsAt,
      props.description, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get productId(): EntityId { return this._productId; }
  public get discountPercent(): number { return this._discountPercent; }
  public get originalPrice(): number { return this._originalPrice; }
  public get salePrice(): number { return this._salePrice; }
  public get currency(): string { return this._currency; }
  public get status(): FlashSaleStatus { return this._status; }
  public get totalQuantity(): number { return this._totalQuantity; }
  public get soldQuantity(): number { return this._soldQuantity; }
  public get startsAt(): Date { return this._startsAt; }
  public get endsAt(): Date { return this._endsAt; }
  public get description(): string | undefined { return this._description; }
  public get version(): number { return this._version; }

  public isActive(): boolean {
    const now = new Date();
    return this._status === 'ACTIVE' && now >= this._startsAt && now <= this._endsAt && this._soldQuantity < this._totalQuantity;
  }

  public start(): void {
    if (this._status === 'SCHEDULED') this._status = 'ACTIVE';
  }

  public end(): void {
    if (this._status === 'ACTIVE') this._status = 'ENDED';
  }

  public cancel(): void { this._status = 'CANCELLED'; }

  public recordSale(quantity: number): void {
    this._soldQuantity += quantity;
    if (this._soldQuantity >= this._totalQuantity) {
      this._status = 'ENDED';
    }
  }

  public toDto() {
    return {
      id: this.id.value,
      productId: this._productId.value,
      discountPercent: this._discountPercent,
      originalPrice: this._originalPrice,
      salePrice: this._salePrice,
      currency: this._currency,
      status: this._status,
      totalQuantity: this._totalQuantity,
      soldQuantity: this._soldQuantity,
      remainingQuantity: this._totalQuantity - this._soldQuantity,
      startsAt: this._startsAt,
      endsAt: this._endsAt,
      description: this._description,
    };
  }
}
