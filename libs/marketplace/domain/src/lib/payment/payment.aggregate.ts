import { AggregateRoot, EntityId, Money, TenantId } from '@afri-market/kernel';
import { PaymentMethod, PaymentStatus } from './payment-status';

export interface CreatePaymentProps {
  readonly tenantId: TenantId;
  readonly orderId: EntityId;
  readonly customerId: EntityId;
  readonly vendorId: EntityId;
  readonly amount: Money;
  readonly method: PaymentMethod;
  readonly systemCommission: Money;
  readonly vendorNet: Money;
  readonly driverNet: Money;
}

export interface ReconstitutePaymentProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly orderId: EntityId;
  readonly customerId: EntityId;
  readonly vendorId: EntityId;
  readonly amount: Money;
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly systemCommission: Money;
  readonly vendorNet: Money;
  readonly driverNet: Money;
  readonly transactionRef: string | undefined;
  readonly receiptNumber?: string | undefined;
  readonly initiatedAt: Date | undefined;
  readonly confirmedAt: Date | undefined;
  readonly version: number;
}

export class Payment extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _orderId: EntityId,
    private readonly _customerId: EntityId,
    private readonly _vendorId: EntityId,
    private _amount: Money,
    private readonly _method: PaymentMethod,
    private _status: PaymentStatus,
    private _systemCommission: Money,
    private _vendorNet: Money,
    private _driverNet: Money,
    private _transactionRef: string | undefined,
    private _receiptNumber: string | undefined,
    private _initiatedAt: Date | undefined,
    private _confirmedAt: Date | undefined,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreatePaymentProps): Payment {
    const initialStatus = props.method === 'cash' ? 'ESCROW_HELD' : 'PENDING';
    const now = new Date();
    return new Payment(
      EntityId.create(), props.tenantId, props.orderId, props.customerId,
      props.vendorId, props.amount, props.method, initialStatus,
      props.systemCommission, props.vendorNet, props.driverNet,
      undefined,
      props.method === 'cash' ? undefined : now,
      undefined, 1,
    );
  }

  public static reconstitute(props: ReconstitutePaymentProps): Payment {
    return new Payment(
      props.id, props.tenantId, props.orderId, props.customerId,
      props.vendorId, props.amount, props.method, props.status,
      props.systemCommission, props.vendorNet, props.driverNet,
      props.transactionRef, props.receiptNumber, props.initiatedAt, props.confirmedAt, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get orderId(): EntityId { return this._orderId; }
  public get customerId(): EntityId { return this._customerId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get amount(): Money { return this._amount; }
  public get method(): PaymentMethod { return this._method; }
  public get status(): PaymentStatus { return this._status; }
  public get systemCommission(): Money { return this._systemCommission; }
  public get vendorNet(): Money { return this._vendorNet; }
  public get driverNet(): Money { return this._driverNet; }
  public get transactionRef(): string | undefined { return this._transactionRef; }
  public get receiptNumber(): string | undefined { return this._receiptNumber; }
  public get initiatedAt(): Date | undefined { return this._initiatedAt; }
  public get confirmedAt(): Date | undefined { return this._confirmedAt; }
  public get version(): number { return this._version; }

  public release(transactionRef: string): void {
    this._status = 'RELEASED';
    this._transactionRef = transactionRef;
    this._confirmedAt = new Date();
  }

  public setTransactionRef(transactionRef: string): void {
    this._transactionRef = transactionRef;
  }

  /** Provider receipt (e.g. M-Pesa code). Never overwrites transactionRef, which is the idempotency key webhooks look up. */
  public setReceiptNumber(receiptNumber: string): void {
    this._receiptNumber = receiptNumber;
  }

  public confirmEscrow(): void {
    if (this._status === 'PENDING') {
      this._status = 'ESCROW_HELD';
      this._confirmedAt = new Date();
    }
  }

  public refund(): void { this._status = 'REFUNDED'; }
  public fail(): void { this._status = 'FAILED'; }

  public toDto() {
    return {
      id: this.id.value,
      orderId: this._orderId.value,
      customerId: this._customerId.value,
      vendorId: this._vendorId.value,
      amount: this._amount.amount,
      currency: this._amount.currency,
      method: this._method,
      status: this._status,
      systemCommission: this._systemCommission.amount,
      vendorNet: this._vendorNet.amount,
      driverNet: this._driverNet.amount,
      transactionRef: this._transactionRef,
      receiptNumber: this._receiptNumber,
      initiatedAt: this._initiatedAt,
      confirmedAt: this._confirmedAt,
      version: this._version,
    };
  }
}
