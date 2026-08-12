import { AggregateRoot, EntityId, Guard, Money, TenantId } from '@afri-market/kernel';

export type SupplierOrderStatus = 'ORDERED' | 'RECEIVED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type PurchaseOrderPaymentStatus = 'UNPAID' | 'PAID';

export interface CreateSupplierOrderItemProps {
  readonly productId: EntityId;
  readonly productName: string;
  readonly sku?: string;
  readonly quantity: number;
  readonly unitCost: Money;
}

export interface SupplierOrderItemDto {
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  currency: string;
}

export class SupplierOrderItem {
  private constructor(
    private readonly _productId: EntityId,
    private readonly _productName: string,
    private readonly _sku: string | undefined,
    private readonly _quantity: number,
    private readonly _unitCost: Money,
    private readonly _totalCost: Money,
  ) {}

  public static create(props: CreateSupplierOrderItemProps): SupplierOrderItem {
    Guard.assert(props.quantity > 0, 'Quantity must be positive');
    const total = Money.create(props.unitCost.amount * props.quantity, props.unitCost.currency);
    return new SupplierOrderItem(
      props.productId, props.productName, props.sku,
      props.quantity, props.unitCost, total,
    );
  }

  public get productId(): EntityId { return this._productId; }
  public get productName(): string { return this._productName; }
  public get sku(): string | undefined { return this._sku; }
  public get quantity(): number { return this._quantity; }
  public get unitCost(): Money { return this._unitCost; }
  public get totalCost(): Money { return this._totalCost; }

  public toDto(): SupplierOrderItemDto {
    return {
      productId: this._productId.value,
      productName: this._productName,
      sku: this._sku ?? null,
      quantity: this._quantity,
      unitCost: this._unitCost.amount,
      totalCost: this._totalCost.amount,
      currency: this._totalCost.currency,
    };
  }
}

export interface CreateSupplierOrderProps {
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly operatorId: EntityId;
  readonly supplierId?: string;
  readonly poNumber: string;
  readonly items: SupplierOrderItem[];
  readonly subtotal: Money;
  readonly notes?: string;
}

export interface ReconstituteSupplierOrderProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly operatorId: EntityId;
  readonly supplierId: string | undefined;
  readonly poNumber: string;
  readonly items: SupplierOrderItem[];
  readonly subtotal: Money;
  readonly status: SupplierOrderStatus;
  readonly paymentStatus: PurchaseOrderPaymentStatus;
  readonly notes: string | undefined;
  readonly receivedAt: Date | undefined;
  readonly confirmedAt: Date | undefined;
  readonly completedAt: Date | undefined;
  readonly createdAt: Date;
  readonly version: number;
}

export class SupplierOrder extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _vendorId: EntityId,
    private readonly _operatorId: EntityId,
    private readonly _supplierId: string | undefined,
    private readonly _poNumber: string,
    private readonly _items: SupplierOrderItem[],
    private readonly _subtotal: Money,
    private _status: SupplierOrderStatus,
    private _paymentStatus: PurchaseOrderPaymentStatus,
    private readonly _notes: string | undefined,
    private _receivedAt: Date | undefined,
    private _confirmedAt: Date | undefined,
    private _completedAt: Date | undefined,
    private readonly _createdAt: Date,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateSupplierOrderProps): SupplierOrder {
    Guard.assert(props.items.length > 0, 'Purchase order must contain at least one item');
    return new SupplierOrder(
      EntityId.create(), props.tenantId, props.vendorId, props.operatorId,
      props.supplierId, props.poNumber, props.items, props.subtotal,
      'ORDERED', 'UNPAID', props.notes, undefined, undefined, undefined, new Date(), 1,
    );
  }

  public static reconstitute(props: ReconstituteSupplierOrderProps): SupplierOrder {
    return new SupplierOrder(
      props.id, props.tenantId, props.vendorId, props.operatorId,
      props.supplierId, props.poNumber, props.items, props.subtotal,
      props.status, props.paymentStatus, props.notes, props.receivedAt,
      props.confirmedAt, props.completedAt, props.createdAt, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get operatorId(): EntityId { return this._operatorId; }
  public get supplierId(): string | undefined { return this._supplierId; }
  public get poNumber(): string { return this._poNumber; }
  public get items(): SupplierOrderItem[] { return this._items; }
  public get subtotal(): Money { return this._subtotal; }
  public get status(): SupplierOrderStatus { return this._status; }
  public get paymentStatus(): PurchaseOrderPaymentStatus { return this._paymentStatus; }
  public get notes(): string | undefined { return this._notes; }
  public get receivedAt(): Date | undefined { return this._receivedAt; }
  public get confirmedAt(): Date | undefined { return this._confirmedAt; }
  public get completedAt(): Date | undefined { return this._completedAt; }
  public get createdAt(): Date { return this._createdAt; }
  public get version(): number { return this._version; }

  public receive(): void {
    Guard.assert(this._status === 'ORDERED', 'Only an ordered purchase order can be received');
    this._status = 'RECEIVED';
    this._receivedAt = new Date();
  }

  public confirm(): void {
    Guard.assert(this._status === 'RECEIVED', 'Only a received purchase order can be confirmed');
    this._status = 'CONFIRMED';
    this._confirmedAt = new Date();
  }

  public complete(): void {
    Guard.assert(this._status === 'CONFIRMED', 'Only a confirmed purchase order can be completed');
    this._status = 'COMPLETED';
    this._completedAt = new Date();
  }

  public cancel(): void {
    Guard.assert(this._status === 'ORDERED', 'Only an ordered purchase order can be cancelled');
    this._status = 'CANCELLED';
  }

  public markPaid(): void {
    Guard.assert(this._status !== 'CANCELLED', 'A cancelled purchase order cannot be marked paid');
    this._paymentStatus = 'PAID';
  }

  public markUnpaid(): void {
    this._paymentStatus = 'UNPAID';
  }

  public toDto() {
    return {
      id: this.id.value,
      vendorId: this._vendorId.value,
      operatorId: this._operatorId.value,
      supplierId: this._supplierId ?? null,
      poNumber: this._poNumber,
      items: this._items.map((i) => i.toDto()),
      subtotal: this._subtotal.amount,
      currency: this._subtotal.currency,
      status: this._status,
      paymentStatus: this._paymentStatus,
      notes: this._notes ?? null,
      receivedAt: this._receivedAt?.toISOString() ?? null,
      confirmedAt: this._confirmedAt?.toISOString() ?? null,
      completedAt: this._completedAt?.toISOString() ?? null,
      createdAt: this._createdAt.toISOString(),
    };
  }
}