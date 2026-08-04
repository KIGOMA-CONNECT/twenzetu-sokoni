import { AggregateRoot, EntityId, Guard, Money, TenantId } from '@afri-market/kernel';

export type CartStatus = 'ACTIVE' | 'CHECKED_OUT';

export interface CartItemSnapshot {
  readonly id: string;
  readonly productId: EntityId;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: Money;
}

export interface AddableProduct {
  readonly id: string;
  readonly name: string;
  readonly price: Money;
  readonly stockQuantity: number;
}

export class CartItem {
  private _quantity: number;

  private constructor(
    public readonly id: string,
    public readonly productId: EntityId,
    public readonly productName: string,
    quantity: number,
    public readonly unitPrice: Money,
  ) {
    this._quantity = quantity;
  }

  public static create(product: AddableProduct, quantity: number, id?: string): CartItem {
    Guard.assert(quantity > 0, 'Quantity must be positive');
    Guard.assert(product.stockQuantity >= quantity, 'Insufficient stock');
    return new CartItem(
      id ?? EntityId.create().value,
      EntityId.from(product.id),
      product.name,
      quantity,
      product.price,
    );
  }

  public get quantity(): number {
    return this._quantity;
  }

  public get totalPrice(): Money {
    return Money.create(this.unitPrice.amount * this._quantity, this.unitPrice.currency);
  }

  public updateQuantity(quantity: number, availableStock: number): void {
    Guard.assert(quantity > 0, 'Quantity must be positive');
    Guard.assert(availableStock >= quantity, 'Insufficient stock');
    this._quantity = quantity;
  }

  public increaseQuantity(by: number, availableStock: number): void {
    Guard.assert(by > 0, 'Quantity must be positive');
    Guard.assert(availableStock >= this._quantity + by, 'Insufficient stock');
    this._quantity += by;
  }

  public toSnapshot(): CartItemSnapshot {
    return {
      id: this.id,
      productId: this.productId,
      productName: this.productName,
      quantity: this._quantity,
      unitPrice: this.unitPrice,
    };
  }
}

export interface CreateCartProps {
  readonly tenantId: TenantId;
  readonly userId: EntityId;
  readonly vendorId: EntityId;
  readonly currency?: string;
}

export interface ReconstituteCartProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly userId: EntityId;
  readonly vendorId: EntityId;
  readonly currency: string;
  readonly status: CartStatus;
  readonly items: CartItem[];
  readonly createdAt?: Date;
}

export class Cart extends AggregateRoot<EntityId> {
  private _items: CartItem[];

  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _userId: EntityId,
    private readonly _vendorId: EntityId,
    private _currency: string,
    private _status: CartStatus,
    items: CartItem[],
    private readonly _createdAt: Date = new Date(),
  ) {
    super(id);
    this._items = items;
  }

  public static create(props: CreateCartProps): Cart {
    return new Cart(
      EntityId.create(),
      props.tenantId,
      props.userId,
      props.vendorId,
      props.currency ?? 'TZS',
      'ACTIVE',
      [],
    );
  }

  public static reconstitute(props: ReconstituteCartProps): Cart {
    return new Cart(
      props.id,
      props.tenantId,
      props.userId,
      props.vendorId,
      props.currency,
      props.status,
      props.items,
      props.createdAt ?? new Date(),
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get userId(): EntityId { return this._userId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get currency(): string { return this._currency; }
  public get status(): CartStatus { return this._status; }
  public get items(): CartItem[] { return this._items; }
  public get createdAt(): Date { return this._createdAt; }

  public get itemCount(): number {
    return this._items.reduce((sum, item) => sum + item.quantity, 0);
  }

  public get subtotal(): Money {
    let amount = 0;
    for (const item of this._items) {
      amount += item.totalPrice.amount;
    }
    return Money.create(amount, this._currency);
  }

  public addItem(product: AddableProduct, quantity: number): void {
    Guard.assert(quantity > 0, 'Quantity must be positive');
    Guard.assert(this._status === 'ACTIVE', 'Cart is not active');
    const existing = this._items.find((i) => i.productId.value === product.id);
    if (existing) {
      existing.increaseQuantity(quantity, product.stockQuantity);
    } else {
      this._items.push(CartItem.create(product, quantity));
    }
  }

  public updateItemQuantity(productId: string, quantity: number, availableStock: number): boolean {
    const existing = this._items.find((i) => i.productId.value === productId);
    if (!existing) {
      return false;
    }
    if (quantity <= 0) {
      this._items = this._items.filter((i) => i.productId.value !== productId);
    } else {
      existing.updateQuantity(quantity, availableStock);
    }
    return true;
  }

  public removeItem(productId: string): boolean {
    const before = this._items.length;
    this._items = this._items.filter((i) => i.productId.value !== productId);
    return this._items.length !== before;
  }

  public clear(): void {
    this._items = [];
  }

  public markCheckedOut(): void {
    this._status = 'CHECKED_OUT';
  }
}
