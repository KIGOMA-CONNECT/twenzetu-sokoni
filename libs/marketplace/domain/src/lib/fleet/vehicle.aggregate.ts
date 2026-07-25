import { AggregateRoot, EntityId, TenantId } from '@afri-market/kernel';
import { VehicleType } from './vehicle-type';

export interface CreateVehicleProps {
  readonly tenantId: TenantId;
  readonly driverId: EntityId;
  readonly vehicleType: VehicleType;
  readonly plateNumber: string;
  readonly capacityKg: number;
}

export interface ReconstituteVehicleProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly driverId: EntityId;
  readonly vehicleType: VehicleType;
  readonly plateNumber: string;
  readonly capacityKg: number;
  readonly isAvailable: boolean;
  readonly currentLatitude: number | undefined;
  readonly currentLongitude: number | undefined;
  readonly version: number;
}

export class Vehicle extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _driverId: EntityId,
    private readonly _vehicleType: VehicleType,
    private _plateNumber: string,
    private _capacityKg: number,
    private _isAvailable: boolean,
    private _currentLatitude: number | undefined,
    private _currentLongitude: number | undefined,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateVehicleProps): Vehicle {
    return new Vehicle(
      EntityId.create(), props.tenantId, props.driverId, props.vehicleType,
      props.plateNumber, props.capacityKg, true, undefined, undefined, 1,
    );
  }

  public static reconstitute(props: ReconstituteVehicleProps): Vehicle {
    return new Vehicle(
      props.id, props.tenantId, props.driverId, props.vehicleType,
      props.plateNumber, props.capacityKg, props.isAvailable,
      props.currentLatitude, props.currentLongitude, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get driverId(): EntityId { return this._driverId; }
  public get vehicleType(): VehicleType { return this._vehicleType; }
  public get plateNumber(): string { return this._plateNumber; }
  public get capacityKg(): number { return this._capacityKg; }
  public get isAvailable(): boolean { return this._isAvailable; }

  public updateLocation(lat: number, lng: number): void {
    this._currentLatitude = lat;
    this._currentLongitude = lng;
  }
  public markAvailable(): void { this._isAvailable = true; }
  public markUnavailable(): void { this._isAvailable = false; }
}
