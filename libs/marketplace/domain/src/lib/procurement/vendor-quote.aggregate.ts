import { AggregateRoot, EntityId, Money } from '@afri-market/kernel';
import { ItemCondition } from './procurement-status';

export interface CreateVendorQuoteProps {
  readonly procurementId: EntityId;
  readonly vendorId: EntityId;
  readonly price: Money;
  readonly itemCondition: ItemCondition;
  readonly warrantyPeriodDays?: number;
}

export interface ReconstituteVendorQuoteProps {
  readonly id: EntityId;
  readonly procurementId: EntityId;
  readonly vendorId: EntityId;
  readonly price: Money;
  readonly itemCondition: ItemCondition;
  readonly warrantyPeriodDays: number;
  readonly version: number;
}

export class VendorQuote extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _procurementId: EntityId,
    private readonly _vendorId: EntityId,
    private _price: Money,
    private readonly _itemCondition: ItemCondition,
    private readonly _warrantyPeriodDays: number,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateVendorQuoteProps): VendorQuote {
    return new VendorQuote(
      EntityId.create(), props.procurementId, props.vendorId,
      props.price, props.itemCondition, props.warrantyPeriodDays ?? 0, 1,
    );
  }

  public static reconstitute(props: ReconstituteVendorQuoteProps): VendorQuote {
    return new VendorQuote(
      props.id, props.procurementId, props.vendorId,
      props.price, props.itemCondition, props.warrantyPeriodDays, props.version,
    );
  }

  public get procurementId(): EntityId { return this._procurementId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get price(): Money { return this._price; }
  public get itemCondition(): ItemCondition { return this._itemCondition; }
  public get warrantyPeriodDays(): number { return this._warrantyPeriodDays; }
}
