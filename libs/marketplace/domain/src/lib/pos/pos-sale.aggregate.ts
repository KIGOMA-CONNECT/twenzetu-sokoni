import { AggregateRoot, EntityId, Guard, Money, TenantId } from '@afri-market/kernel';
import { PosPaymentMethod } from './pos-payment-method';

export type PosSaleStatus = 'COMPLETED' | 'REFUNDED';

export interface CreatePosSaleItemProps {
  readonly productId: EntityId;
  readonly productName: string;
  readonly sku?: string;
  readonly barcode?: string;
  readonly quantity: number;
  readonly unitPrice: Money;
}

export interface PosSaleItemDto {
  productId: string;
  productName: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

export class PosSaleItem {
  private constructor(
    private readonly _productId: EntityId,
    private readonly _productName: string,
    private readonly _sku: string | undefined,
    private readonly _barcode: string | undefined,
    private readonly _quantity: number,
    private readonly _unitPrice: Money,
    private readonly _totalPrice: Money,
  ) {}

  public static create(props: CreatePosSaleItemProps): PosSaleItem {
    Guard.assert(props.quantity > 0, 'Quantity must be positive');
    const total = Money.create(props.unitPrice.amount * props.quantity, props.unitPrice.currency);
    return new PosSaleItem(
      props.productId, props.productName, props.sku, props.barcode,
      props.quantity, props.unitPrice, total,
    );
  }

  public get productId(): EntityId { return this._productId; }
  public get productName(): string { return this._productName; }
  public get sku(): string | undefined { return this._sku; }
  public get barcode(): string | undefined { return this._barcode; }
  public get quantity(): number { return this._quantity; }
  public get unitPrice(): Money { return this._unitPrice; }
  public get totalPrice(): Money { return this._totalPrice; }

  public toDto(): PosSaleItemDto {
    return {
      productId: this._productId.value,
      productName: this._productName,
      sku: this._sku ?? null,
      barcode: this._barcode ?? null,
      quantity: this._quantity,
      unitPrice: this._unitPrice.amount,
      totalPrice: this._totalPrice.amount,
      currency: this._totalPrice.currency,
    };
  }
}

export interface CreatePosSaleProps {
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly operatorId: EntityId;
  readonly saleNumber: string;
  readonly items: PosSaleItem[];
  readonly subtotal: Money;
  readonly discount: Money;
  readonly tax: Money;
  readonly total: Money;
  readonly paymentMethod: PosPaymentMethod;
  readonly amountTendered?: Money;
}

export interface ReconstitutePosSaleProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly operatorId: EntityId;
  readonly saleNumber: string;
  readonly items: PosSaleItem[];
  readonly subtotal: Money;
  readonly discount: Money;
  readonly tax: Money;
  readonly total: Money;
  readonly paymentMethod: PosPaymentMethod;
  readonly amountTendered: Money | undefined;
  readonly status: PosSaleStatus;
  readonly createdAt: Date;
  readonly version: number;
}

export class PosSale extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _vendorId: EntityId,
    private readonly _operatorId: EntityId,
    private readonly _saleNumber: string,
    private readonly _items: PosSaleItem[],
    private readonly _subtotal: Money,
    private readonly _discount: Money,
    private readonly _tax: Money,
    private readonly _total: Money,
    private readonly _paymentMethod: PosPaymentMethod,
    private readonly _amountTendered: Money | undefined,
    private _status: PosSaleStatus,
    private readonly _createdAt: Date,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreatePosSaleProps): PosSale {
    Guard.assert(props.items.length > 0, 'Sale must contain at least one item');
    return new PosSale(
      EntityId.create(), props.tenantId, props.vendorId, props.operatorId,
      props.saleNumber, props.items, props.subtotal, props.discount,
      props.tax, props.total, props.paymentMethod, props.amountTendered,
      'COMPLETED', new Date(), 1,
    );
  }

  public static reconstitute(props: ReconstitutePosSaleProps): PosSale {
    return new PosSale(
      props.id, props.tenantId, props.vendorId, props.operatorId,
      props.saleNumber, props.items, props.subtotal, props.discount,
      props.tax, props.total, props.paymentMethod, props.amountTendered,
      props.status, props.createdAt, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get operatorId(): EntityId { return this._operatorId; }
  public get saleNumber(): string { return this._saleNumber; }
  public get items(): PosSaleItem[] { return this._items; }
  public get subtotal(): Money { return this._subtotal; }
  public get discount(): Money { return this._discount; }
  public get tax(): Money { return this._tax; }
  public get total(): Money { return this._total; }
  public get paymentMethod(): PosPaymentMethod { return this._paymentMethod; }
  public get amountTendered(): Money | undefined { return this._amountTendered; }
  public get status(): PosSaleStatus { return this._status; }
  public get createdAt(): Date { return this._createdAt; }
  public get version(): number { return this._version; }

  public refund(): void {
    if (this._status === 'REFUNDED') throw new Error('Sale already refunded');
    this._status = 'REFUNDED';
  }

  public toDto() {
    return {
      id: this.id.value,
      vendorId: this._vendorId.value,
      operatorId: this._operatorId.value,
      saleNumber: this._saleNumber,
      items: this._items.map((i) => i.toDto()),
      subtotal: this._subtotal.amount,
      discount: this._discount.amount,
      tax: this._tax.amount,
      total: this._total.amount,
      currency: this._total.currency,
      paymentMethod: this._paymentMethod,
      amountTendered: this._amountTendered?.amount ?? null,
      status: this._status,
      createdAt: this._createdAt.toISOString(),
    };
  }
}