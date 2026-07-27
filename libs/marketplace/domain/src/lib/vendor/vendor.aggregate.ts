import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';

export interface CreateVendorProps {
  readonly tenantId: TenantId;
  readonly userId: EntityId;
  readonly shopName: string;
  readonly description?: string;
  readonly category: string;
  readonly commissionRate: number;
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
  ) {
    super(id);
  }

  public static create(props: CreateVendorProps): Vendor {
    Guard.assert(Guard.againstEmptyString(props.shopName, 'shopName'));
    Guard.assert(props.commissionRate >= 0 && props.commissionRate <= 100, 'Commission rate must be 0-100');
    return new Vendor(
      EntityId.create(), props.tenantId, props.userId, props.shopName,
      props.description, props.category, props.commissionRate,
      'PENDING', 0, 0, 1,
    );
  }

  public static reconstitute(props: ReconstituteVendorProps): Vendor {
    return new Vendor(
      props.id, props.tenantId, props.userId, props.shopName,
      props.description, props.category, props.commissionRate,
      props.status, props.averageRating, props.totalOrders, props.version,
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
    };
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
