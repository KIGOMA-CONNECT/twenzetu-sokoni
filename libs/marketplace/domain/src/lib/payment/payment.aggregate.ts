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
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreatePaymentProps): Payment {
    return new Payment(
      EntityId.create(), props.tenantId, props.orderId, props.customerId,
      props.vendorId, props.amount, props.method, 'ESCROW_HELD',
      props.systemCommission, props.vendorNet, props.driverNet,
      undefined, 1,
    );
  }

  public static reconstitute(props: ReconstitutePaymentProps): Payment {
    return new Payment(
      props.id, props.tenantId, props.orderId, props.customerId,
      props.vendorId, props.amount, props.method, props.status,
      props.systemCommission, props.vendorNet, props.driverNet,
      props.transactionRef, props.version,
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
  public get version(): number { return this._version; }

  public release(transactionRef: string): void {
    this._status = 'RELEASED';
    this._transactionRef = transactionRef;
  }

  public refund(): void { this._status = 'REFUNDED'; }
  public fail(): void { this._status = 'FAILED'; }
}
