import { AggregateRoot, EntityId, Money, TenantId } from '@afri-market/kernel';

export type UsedGoodsStatus = 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'REMOVED';
export type UsedGoodsCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export interface CreateUsedGoodsProps {
  readonly tenantId: TenantId;
  readonly sellerId: EntityId;
  readonly sellerName: string;
  readonly sellerPhone: string;
  readonly title: string;
  readonly description?: string;
  readonly category: string;
  readonly askingPrice: Money;
  readonly photoUrls?: string[];
  readonly location: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly condition: UsedGoodsCondition;
}

export interface ReconstituteUsedGoodsProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly sellerId: EntityId;
  readonly sellerName: string;
  readonly sellerPhone: string;
  readonly title: string;
  readonly description: string | undefined;
  readonly category: string;
  readonly askingPrice: Money;
  readonly status: UsedGoodsStatus;
  readonly photoUrls: string[] | undefined;
  readonly location: string;
  readonly latitude: number | undefined;
  readonly longitude: number | undefined;
  readonly condition: UsedGoodsCondition;
  readonly views: number;
  readonly escrowId: string | undefined;
  readonly version: number;
}

export class UsedGoods extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _sellerId: EntityId,
    private readonly _sellerName: string,
    private readonly _sellerPhone: string,
    private readonly _title: string,
    private readonly _description: string | undefined,
    private readonly _category: string,
    private _askingPrice: Money,
    private _status: UsedGoodsStatus,
    private readonly _photoUrls: string[] | undefined,
    private readonly _location: string,
    private readonly _latitude: number | undefined,
    private readonly _longitude: number | undefined,
    private readonly _condition: UsedGoodsCondition,
    private _views: number,
    private _escrowId: string | undefined,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateUsedGoodsProps): UsedGoods {
    return new UsedGoods(
      EntityId.create(), props.tenantId, props.sellerId, props.sellerName,
      props.sellerPhone, props.title, props.description, props.category,
      props.askingPrice, 'AVAILABLE', props.photoUrls, props.location,
      props.latitude, props.longitude, props.condition, 0, undefined, 1,
    );
  }

  public static reconstitute(props: ReconstituteUsedGoodsProps): UsedGoods {
    return new UsedGoods(
      props.id, props.tenantId, props.sellerId, props.sellerName,
      props.sellerPhone, props.title, props.description, props.category,
      props.askingPrice, props.status, props.photoUrls, props.location,
      props.latitude, props.longitude, props.condition, props.views,
      props.escrowId, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get sellerId(): EntityId { return this._sellerId; }
  public get sellerName(): string { return this._sellerName; }
  public get sellerPhone(): string { return this._sellerPhone; }
  public get title(): string { return this._title; }
  public get description(): string | undefined { return this._description; }
  public get category(): string { return this._category; }
  public get askingPrice(): Money { return this._askingPrice; }
  public get status(): UsedGoodsStatus { return this._status; }
  public get photoUrls(): string[] | undefined { return this._photoUrls; }
  public get location(): string { return this._location; }
  public get latitude(): number | undefined { return this._latitude; }
  public get longitude(): number | undefined { return this._longitude; }
  public get condition(): UsedGoodsCondition { return this._condition; }
  public get views(): number { return this._views; }
  public get escrowId(): string | undefined { return this._escrowId; }
  public get version(): number { return this._version; }

  public markAsSold(escrowId?: string): void {
    this._status = 'SOLD';
    this._escrowId = escrowId;
  }
  public markAsReserved(): void { this._status = 'RESERVED'; }
  public remove(): void { this._status = 'REMOVED'; }
  public incrementViews(): void { this._views++; }
  public updateTitle(title: string): void { (this as unknown as { _title: string })._title = title; }
  public updateDescription(description: string): void { (this as unknown as { _description: string | undefined })._description = description; }
  public updateAskingPrice(price: Money): void { this._askingPrice = price; }
}
