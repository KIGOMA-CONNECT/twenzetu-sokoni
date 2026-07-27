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
  readonly isOnline: boolean;
  readonly verifiedAt: Date | null;
  readonly licensePhotoUrl: string | null;
  readonly insurancePhotoUrl: string | null;
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
    private _isOnline: boolean,
    private _verifiedAt: Date | null,
    private _licensePhotoUrl: string | null,
    private _insurancePhotoUrl: string | null,
    private _currentLatitude: number | undefined,
    private _currentLongitude: number | undefined,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateVehicleProps): Vehicle {
    return new Vehicle(
      EntityId.create(), props.tenantId, props.driverId, props.vehicleType,
      props.plateNumber, props.capacityKg, true, false, null, null, null, undefined, undefined, 1,
    );
  }

  public static reconstitute(props: ReconstituteVehicleProps): Vehicle {
    return new Vehicle(
      props.id, props.tenantId, props.driverId, props.vehicleType,
      props.plateNumber, props.capacityKg, props.isAvailable,
      props.isOnline, props.verifiedAt, props.licensePhotoUrl, props.insurancePhotoUrl,
      props.currentLatitude, props.currentLongitude, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get driverId(): EntityId { return this._driverId; }
  public get vehicleType(): VehicleType { return this._vehicleType; }
  public get plateNumber(): string { return this._plateNumber; }
  public get capacityKg(): number { return this._capacityKg; }
  public get isAvailable(): boolean { return this._isAvailable; }
  public get isOnline(): boolean { return this._isOnline; }
  public get verifiedAt(): Date | null { return this._verifiedAt; }
  public get licensePhotoUrl(): string | null { return this._licensePhotoUrl; }
  public get insurancePhotoUrl(): string | null { return this._insurancePhotoUrl; }

  public goOnline(): void { this._isOnline = true; }
  public goOffline(): void { this._isOnline = false; }
  public verify(): void { this._verifiedAt = new Date(); }

  public updateLocation(lat: number, lng: number): void {
    this._currentLatitude = lat;
    this._currentLongitude = lng;
  }
  public markAvailable(): void { this._isAvailable = true; }
  public markUnavailable(): void { this._isAvailable = false; }

  public toDto() {
    return {
      id: this.id.value,
      driverId: this._driverId.value,
      vehicleType: this._vehicleType,
      plateNumber: this._plateNumber,
      capacityKg: this._capacityKg,
      isAvailable: this._isAvailable,
      isOnline: this._isOnline,
      verifiedAt: this._verifiedAt,
      licensePhotoUrl: this._licensePhotoUrl,
      insurancePhotoUrl: this._insurancePhotoUrl,
      status: this._isAvailable ? 'AVAILABLE' : 'IN_USE',
    };
  }
}
