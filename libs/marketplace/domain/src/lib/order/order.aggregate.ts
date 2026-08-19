import { AggregateRoot, EntityId, Money, TenantId } from '@afri-market/kernel';
import { OrderStatus, OrderType } from './order-status';

export interface CreateOrderProps {
  readonly tenantId: TenantId;
  readonly customerId: EntityId;
  readonly vendorId: EntityId;
  readonly type: OrderType;
  readonly deliveryAddress: string;
  readonly deliveryLatitude?: number;
  readonly deliveryLongitude?: number;
  readonly specialInstructions?: string;
}

export interface ReconstituteOrderProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly customerId: EntityId;
  readonly vendorId: EntityId;
  readonly driverId: EntityId | undefined;
  readonly type: OrderType;
  readonly status: OrderStatus;
  readonly subtotal: Money;
  readonly deliveryFee: Money;
  readonly systemCommission: Money;
  readonly totalAmount: Money;
  readonly deliveryAddress: string;
  readonly deliveryLatitude: number | undefined;
  readonly deliveryLongitude: number | undefined;
  readonly specialInstructions: string | undefined;
  readonly OTPCode: string | undefined;
  readonly OTPVerified: boolean;
  readonly OTPAttempts: number;
  readonly PickupCode: string | undefined;
  readonly version: number;
  readonly createdAt?: Date;
}

export const MAX_OTP_ATTEMPTS = 5;

export class Order extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _customerId: EntityId,
    private readonly _vendorId: EntityId,
    private _driverId: EntityId | undefined,
    private readonly _type: OrderType,
    private _status: OrderStatus,
    private _subtotal: Money,
    private _deliveryFee: Money,
    private _systemCommission: Money,
    private _totalAmount: Money,
    private _deliveryAddress: string,
    private _deliveryLatitude: number | undefined,
    private _deliveryLongitude: number | undefined,
    private _specialInstructions: string | undefined,
    private _otpCode: string | undefined,
    private _otpVerified: boolean,
    private _otpAttempts: number,
    private _pickupCode: string | undefined,
    private readonly _version: number,
    private readonly _createdAt: Date = new Date(),
  ) {
    super(id);
  }

  public static create(props: CreateOrderProps): Order {
    const zeroMoney = Money.create(0);
    return new Order(
      EntityId.create(), props.tenantId, props.customerId, props.vendorId,
      undefined, props.type, 'PLACED', zeroMoney, zeroMoney, zeroMoney, zeroMoney,
      props.deliveryAddress, props.deliveryLatitude, props.deliveryLongitude,
      props.specialInstructions, undefined, false, 0, undefined, 1, new Date(),
    );
  }

  public static reconstitute(props: ReconstituteOrderProps): Order {
    return new Order(
      props.id, props.tenantId, props.customerId, props.vendorId,
      props.driverId, props.type, props.status, props.subtotal, props.deliveryFee,
      props.systemCommission, props.totalAmount, props.deliveryAddress,
      props.deliveryLatitude, props.deliveryLongitude, props.specialInstructions,
      props.OTPCode, props.OTPVerified, props.OTPAttempts, props.PickupCode, props.version, props.createdAt ?? new Date(),
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get customerId(): EntityId { return this._customerId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get driverId(): EntityId | undefined { return this._driverId; }
  public get type(): OrderType { return this._type; }
  public get status(): OrderStatus { return this._status; }
  public get subtotal(): Money { return this._subtotal; }
  public get deliveryFee(): Money { return this._deliveryFee; }
  public get systemCommission(): Money { return this._systemCommission; }
  public get totalAmount(): Money { return this._totalAmount; }
  public get deliveryAddress(): string { return this._deliveryAddress; }
  public get deliveryLatitude(): number | undefined { return this._deliveryLatitude; }
  public get deliveryLongitude(): number | undefined { return this._deliveryLongitude; }
  public get specialInstructions(): string | undefined { return this._specialInstructions; }
  public get otpCode(): string | undefined { return this._otpCode; }
  public get otpVerified(): boolean { return this._otpVerified; }
  public get otpAttempts(): number { return this._otpAttempts; }
  public get pickupCode(): string | undefined { return this._pickupCode; }
  public get version(): number { return this._version; }
  public get createdAt(): Date { return this._createdAt; }

  public toDto() {
    return {
      id: this.id.value,
      customerId: this._customerId.value,
      vendorId: this._vendorId.value,
      driverId: this._driverId?.value ?? null,
      type: this._type,
      status: this._status,
      subtotal: this._subtotal.amount,
      deliveryFee: this._deliveryFee.amount,
      systemCommission: this._systemCommission.amount,
      totalAmount: this._totalAmount.amount,
      currency: this._subtotal.currency,
      deliveryAddress: this._deliveryAddress,
      deliveryLatitude: this._deliveryLatitude,
      deliveryLongitude: this._deliveryLongitude,
      specialInstructions: this._specialInstructions,
      otpVerified: this._otpVerified,
      pickupCode: this._pickupCode,
      createdAt: this._createdAt,
    };
  }

  public calculateTotals(subtotal: Money, deliveryFee: Money, commissionRate: number): void {
    this._subtotal = subtotal;
    this._deliveryFee = deliveryFee;
    this._systemCommission = subtotal.percentage(commissionRate);
    this._totalAmount = subtotal.add(deliveryFee);
  }

  public assignDriver(driverId: EntityId): void { this._driverId = driverId; }
  public confirm(): void { this._status = 'CONFIRMED'; }
  public startPreparing(): void { this._status = 'PREPARING'; }
  public markReady(): void { this._status = 'READY_FOR_PICKUP'; }
  public startDelivery(): void { this._status = 'OUT_FOR_DELIVERY'; }
  public deliver(): void { this._status = 'DELIVERED'; }
  public cancel(reason?: string): void {
    this._status = 'CANCELLED';
    if (reason) {
      this._specialInstructions = this._specialInstructions
        ? `${this._specialInstructions} | Cancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;
    }
  }
  public updateStatus(status: OrderStatus): void {
    this._status = status;
  }

  public setOTP(code: string): void { this._otpCode = code; }
  public setPickupCode(code: string): void { this._pickupCode = code; }
  public verifyOTP(): void { this._otpVerified = true; }
  public recordOtpFailure(): void { this._otpAttempts += 1; }
  public isOtpLocked(): boolean { return this._otpAttempts >= MAX_OTP_ATTEMPTS; }
}
