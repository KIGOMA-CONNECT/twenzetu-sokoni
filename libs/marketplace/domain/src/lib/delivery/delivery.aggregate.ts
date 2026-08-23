import { AggregateRoot, EntityId, Money, TenantId } from '@afri-market/kernel';
import { DeliveryStatus, VehicleType } from './delivery-status';

export interface CreateDeliveryProps {
  readonly tenantId: TenantId;
  readonly orderId: EntityId;
  readonly driverId: EntityId;
  readonly vehicleType: VehicleType;
  readonly pickupAddress: string;
  readonly deliveryAddress: string;
  readonly pickupLatitude?: number;
  readonly pickupLongitude?: number;
  readonly deliveryLatitude?: number;
  readonly deliveryLongitude?: number;
}

export interface ReconstituteDeliveryProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly orderId: EntityId;
  readonly driverId: EntityId;
  readonly vehicleType: VehicleType;
  readonly status: DeliveryStatus;
  readonly pickupAddress: string;
  readonly deliveryAddress: string;
  readonly pickupLatitude: number | undefined;
  readonly pickupLongitude: number | undefined;
  readonly deliveryLatitude: number | undefined;
  readonly deliveryLongitude: number | undefined;
  readonly distanceKm: number | undefined;
  readonly estimatedTimeMinutes: number | undefined;
  readonly driverEarnings: Money;
  readonly currentLatitude: number | undefined;
  readonly currentLongitude: number | undefined;
  readonly lastLocationUpdate: Date | undefined;
  readonly version: number;
  readonly createdAt?: Date;
}

export class Delivery extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _orderId: EntityId,
    private readonly _driverId: EntityId,
    private readonly _vehicleType: VehicleType,
    private _status: DeliveryStatus,
    private _pickupAddress: string,
    private _deliveryAddress: string,
    private _pickupLatitude: number | undefined,
    private _pickupLongitude: number | undefined,
    private _deliveryLatitude: number | undefined,
    private _deliveryLongitude: number | undefined,
    private _distanceKm: number | undefined,
    private _estimatedTimeMinutes: number | undefined,
    private _driverEarnings: Money,
    private _currentLatitude: number | undefined,
    private _currentLongitude: number | undefined,
    private _lastLocationUpdate: Date | undefined,
    private readonly _version: number,
    private readonly _createdAt?: Date,
  ) {
    super(id);
  }

  public static create(props: CreateDeliveryProps): Delivery {
    return new Delivery(
      EntityId.create(), props.tenantId, props.orderId, props.driverId,
      props.vehicleType, 'PENDING', props.pickupAddress, props.deliveryAddress,
      props.pickupLatitude, props.pickupLongitude,
      props.deliveryLatitude, props.deliveryLongitude,
      undefined, undefined, Money.create(0), undefined, undefined, undefined, 1,
    );
  }

  public static reconstitute(props: ReconstituteDeliveryProps): Delivery {
    return new Delivery(
      props.id, props.tenantId, props.orderId, props.driverId,
      props.vehicleType, props.status, props.pickupAddress, props.deliveryAddress,
      props.pickupLatitude, props.pickupLongitude,
      props.deliveryLatitude, props.deliveryLongitude,
      props.distanceKm, props.estimatedTimeMinutes,
      props.driverEarnings, props.currentLatitude, props.currentLongitude,
      props.lastLocationUpdate, props.version, props.createdAt,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get orderId(): EntityId { return this._orderId; }
  public get driverId(): EntityId { return this._driverId; }
  public get vehicleType(): VehicleType { return this._vehicleType; }
  public get status(): DeliveryStatus { return this._status; }
  public get pickupAddress(): string { return this._pickupAddress; }
  public get deliveryAddress(): string { return this._deliveryAddress; }
  public get driverEarnings(): Money { return this._driverEarnings; }
  public get distanceKm(): number | undefined { return this._distanceKm; }
  public get estimatedTimeMinutes(): number | undefined { return this._estimatedTimeMinutes; }
  public get currentLatitude(): number | undefined { return this._currentLatitude; }
  public get currentLongitude(): number | undefined { return this._currentLongitude; }
  public get lastLocationUpdate(): Date | undefined { return this._lastLocationUpdate; }
  public get version(): number { return this._version; }

  public assign(): void { this._status = 'ASSIGNED'; }
  public pickup(): void { this._status = 'PICKED_UP'; }
  public startTransit(): void { this._status = 'IN_TRANSIT'; }
  public complete(earnings: Money): void {
    this._status = 'DELIVERED';
    this._driverEarnings = earnings;
  }
  public fail(): void { this._status = 'FAILED'; }

  public updateLocation(latitude: number, longitude: number): void {
    this._currentLatitude = latitude;
    this._currentLongitude = longitude;
    this._lastLocationUpdate = new Date();
  }

  public setRouteEstimate(distanceKm: number, estimatedTimeMinutes: number): void {
    this._distanceKm = Math.round(distanceKm * 100) / 100;
    this._estimatedTimeMinutes = Math.max(1, Math.round(estimatedTimeMinutes));
  }

  public toDto() {
    return {
      id: this.id.value,
      orderId: this._orderId.value,
      driverId: this._driverId.value,
      vehicleType: this._vehicleType,
      status: this._status,
      pickupAddress: this._pickupAddress,
      deliveryAddress: this._deliveryAddress,
      pickupLatitude: this._pickupLatitude,
      pickupLongitude: this._pickupLongitude,
      deliveryLatitude: this._deliveryLatitude,
      deliveryLongitude: this._deliveryLongitude,
      distanceKm: this._distanceKm,
      estimatedTimeMinutes: this._estimatedTimeMinutes,
      driverEarnings: this._driverEarnings.amount,
      currency: this._driverEarnings.currency,
      currentLatitude: this._currentLatitude,
      currentLongitude: this._currentLongitude,
      lastLocationUpdate: this._lastLocationUpdate,
      version: this._version,
      createdAt: this._createdAt,
    };
  }
}
