import { AggregateRoot, EntityId, Money, TenantId } from '@afri-market/kernel';
import { ServiceRequestStatus } from './service-status';

export interface CreateServiceRequestProps {
  readonly tenantId: TenantId;
  readonly customerId: EntityId;
  readonly vendorId: EntityId;
  readonly listingId?: EntityId;
  readonly title: string;
  readonly quantity: number;
  readonly unitLabel?: string;
  readonly details?: string;
  readonly photoUrls?: string[];
  readonly currency?: string;
}

export interface ReconstituteServiceRequestProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly customerId: EntityId;
  readonly vendorId: EntityId;
  readonly listingId: EntityId | undefined;
  readonly title: string;
  readonly quantity: number;
  readonly unitLabel: string;
  readonly details: string;
  readonly photoUrls: string[];
  readonly status: ServiceRequestStatus;
  readonly agreedPrice: Money | undefined;
  readonly currency: string;
  readonly version: number;
}

export class ServiceRequest extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _customerId: EntityId,
    private readonly _vendorId: EntityId,
    private readonly _listingId: EntityId | undefined,
    private _title: string,
    private _quantity: number,
    private _unitLabel: string,
    private _details: string,
    private _photoUrls: string[],
    private _status: ServiceRequestStatus,
    private _agreedPrice: Money | undefined,
    private _currency: string,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateServiceRequestProps): ServiceRequest {
    return new ServiceRequest(
      EntityId.create(), props.tenantId, props.customerId, props.vendorId,
      props.listingId, props.title, props.quantity, props.unitLabel ?? 'unit',
      props.details ?? '', props.photoUrls ?? [], 'PENDING', undefined,
      props.currency ?? 'TZS', 1,
    );
  }

  public static reconstitute(props: ReconstituteServiceRequestProps): ServiceRequest {
    return new ServiceRequest(
      props.id, props.tenantId, props.customerId, props.vendorId,
      props.listingId, props.title, props.quantity, props.unitLabel,
      props.details, props.photoUrls, props.status, props.agreedPrice,
      props.currency, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get customerId(): EntityId { return this._customerId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get listingId(): EntityId | undefined { return this._listingId; }
  public get title(): string { return this._title; }
  public get quantity(): number { return this._quantity; }
  public get unitLabel(): string { return this._unitLabel; }
  public get details(): string { return this._details; }
  public get photoUrls(): string[] { return this._photoUrls; }
  public get status(): ServiceRequestStatus { return this._status; }
  public get agreedPrice(): Money | undefined { return this._agreedPrice; }
  public get currency(): string { return this._currency; }
  public get version(): number { return this._version; }

  public receiveQuote(): void {
    if (this._status === 'PENDING') {
      this._status = 'QUOTED';
    }
  }

  public agree(price: Money): void {
    if (this._status === 'ORDERED') {
      throw new Error('Request already converted to an order');
    }
    if (this._status === 'CANCELLED') {
      throw new Error('Cancelled requests cannot be agreed');
    }
    this._agreedPrice = price;
    this._status = 'AGREED';
  }

  public markOrdered(): void {
    if (this._status !== 'AGREED') {
      throw new Error('Only agreed requests can become orders');
    }
    this._status = 'ORDERED';
  }

  public cancel(): void {
    if (this._status === 'ORDERED') {
      throw new Error('Ordered requests cannot be cancelled');
    }
    this._status = 'CANCELLED';
  }

  public toDto() {
    return {
      id: this.id.value,
      customerId: this._customerId.value,
      vendorId: this._vendorId.value,
      listingId: this._listingId?.value ?? null,
      title: this._title,
      quantity: this._quantity,
      unitLabel: this._unitLabel,
      details: this._details,
      photoUrls: this._photoUrls,
      status: this._status,
      agreedPrice: this._agreedPrice?.amount ?? null,
      currency: this._currency,
    };
  }
}
