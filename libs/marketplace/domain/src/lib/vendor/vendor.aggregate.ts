import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';
import { isVendorCategory } from './vendor-category';

export interface CreateVendorProps {
  readonly tenantId: TenantId;
  readonly userId: EntityId;
  readonly shopName: string;
  readonly description?: string;
  readonly category: string;
  readonly commissionRate: number;
  readonly latitude?: number;
  readonly longitude?: number;
}

export interface ReconstituteVendorProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly userId: EntityId;
  readonly shopName: string;
  readonly description: string | undefined;
  readonly category: string;
  readonly commissionRate: number;
  readonly status: VendorStatus;
  readonly averageRating: number;
  readonly totalOrders: number;
  readonly version: number;
  readonly latitude?: number;
  readonly longitude?: number;
}

import { VendorStatus } from './vendor-status';

export class Vendor extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _userId: EntityId,
    private _shopName: string,
    private _description: string | undefined,
    private _category: string,
    private _commissionRate: number,
    private _status: VendorStatus,
    private _averageRating: number,
    private _totalOrders: number,
    private readonly _version: number,
    private _latitude?: number,
    private _longitude?: number,
  ) {
    super(id);
  }

  public static create(props: CreateVendorProps): Vendor {
    Guard.assert(Guard.againstEmptyString(props.shopName, 'shopName'));
    Guard.assert(props.commissionRate >= 0 && props.commissionRate <= 100, 'Commission rate must be 0-100');
    Guard.assert(isVendorCategory(props.category), `Invalid vendor category: ${props.category}`);
    return new Vendor(
      EntityId.create(), props.tenantId, props.userId, props.shopName,
      props.description, props.category, props.commissionRate,
      'PENDING', 0, 0, 1, props.latitude, props.longitude,
    );
  }

  public static reconstitute(props: ReconstituteVendorProps): Vendor {
    return new Vendor(
      props.id, props.tenantId, props.userId, props.shopName,
      props.description, props.category, props.commissionRate,
      props.status, props.averageRating, props.totalOrders, props.version,
      props.latitude, props.longitude,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get userId(): EntityId { return this._userId; }
  public get shopName(): string { return this._shopName; }
  public get description(): string | undefined { return this._description; }
  public get category(): string { return this._category; }
  public get commissionRate(): number { return this._commissionRate; }
  public get status(): VendorStatus { return this._status; }
  public get averageRating(): number { return this._averageRating; }
  public get totalOrders(): number { return this._totalOrders; }
  public get version(): number { return this._version; }
  public get latitude(): number | undefined { return this._latitude; }
  public get longitude(): number | undefined { return this._longitude; }

  public toDto() {
    return {
      id: this.id.value,
      shopName: this._shopName,
      description: this._description,
      category: this._category,
      commissionRate: this._commissionRate,
      status: this._status,
      averageRating: this._averageRating,
      totalOrders: this._totalOrders,
      latitude: this._latitude,
      longitude: this._longitude,
    };
  }

  public updateCoordinates(latitude: number, longitude: number): void {
    this._latitude = latitude;
    this._longitude = longitude;
  }

  public updateProfile(updates: {
    shopName?: string;
    description?: string | null;
    category?: string;
    latitude?: number | null;
    longitude?: number | null;
  }): void {
    if (updates.shopName !== undefined) {
      Guard.assert(Guard.againstEmptyString(updates.shopName, 'shopName'));
      this._shopName = updates.shopName;
    }
    if (updates.description !== undefined) {
      this._description = updates.description ?? undefined;
    }
    if (updates.category !== undefined) {
      Guard.assert(isVendorCategory(updates.category), `Invalid vendor category: ${updates.category}`);
      this._category = updates.category;
    }
    if (updates.latitude !== undefined) {
      this._latitude = updates.latitude ?? undefined;
    }
    if (updates.longitude !== undefined) {
      this._longitude = updates.longitude ?? undefined;
    }
  }

  public approve(): void { this._status = 'ACTIVE'; }
  public suspend(): void { this._status = 'SUSPENDED'; }
  public close(): void { this._status = 'CLOSED'; }

  public updateRating(newRating: number): void {
    const total = this._averageRating * this._totalOrders + newRating;
    this._totalOrders += 1;
    this._averageRating = Math.round((total / this._totalOrders) * 10) / 10;
  }
}
