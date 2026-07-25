import { AggregateRoot, EntityId, Guard, Money } from '@afri-market/kernel';

export interface CreateOrderItemProps {
  readonly orderId: EntityId;
  readonly productId: EntityId;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: Money;
}

export class OrderItem extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _orderId: EntityId,
    private readonly _productId: EntityId,
    private readonly _productName: string,
    private _quantity: number,
    private readonly _unitPrice: Money,
    private readonly _totalPrice: Money,
  ) {
    super(id);
  }

  public static create(props: CreateOrderItemProps): OrderItem {
    Guard.assert(props.quantity > 0, 'Quantity must be positive');
    const total = Money.create(props.unitPrice.amount * props.quantity, props.unitPrice.currency);
    return new OrderItem(
      EntityId.create(), props.orderId, props.productId,
      props.productName, props.quantity, props.unitPrice, total,
    );
  }

  public get orderId(): EntityId { return this._orderId; }
  public get productId(): EntityId { return this._productId; }
  public get productName(): string { return this._productName; }
  public get quantity(): number { return this._quantity; }
  public get unitPrice(): Money { return this._unitPrice; }
  public get totalPrice(): Money { return this._totalPrice; }
}
