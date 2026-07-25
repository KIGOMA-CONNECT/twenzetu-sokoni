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
  readonly version: number;
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
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateDeliveryProps): Delivery {
    return new Delivery(
      EntityId.create(), props.tenantId, props.orderId, props.driverId,
      props.vehicleType, 'PENDING', props.pickupAddress, props.deliveryAddress,
      props.pickupLatitude, props.pickupLongitude,
      props.deliveryLatitude, props.deliveryLongitude,
      undefined, undefined, Money.create(0), 1,
    );
  }

  public static reconstitute(props: ReconstituteDeliveryProps): Delivery {
    return new Delivery(
      props.id, props.tenantId, props.orderId, props.driverId,
      props.vehicleType, props.status, props.pickupAddress, props.deliveryAddress,
      props.pickupLatitude, props.pickupLongitude,
      props.deliveryLatitude, props.deliveryLongitude,
      props.distanceKm, props.estimatedTimeMinutes,
      props.driverEarnings, props.version,
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
  public get version(): number { return this._version; }

  public assign(): void { this._status = 'ASSIGNED'; }
  public pickup(): void { this._status = 'PICKED_UP'; }
  public startTransit(): void { this._status = 'IN_TRANSIT'; }
  public complete(earnings: Money): void {
    this._status = 'DELIVERED';
    this._driverEarnings = earnings;
  }
  public fail(): void { this._status = 'FAILED'; }
}
