import { AggregateRoot, EntityId, Money, TenantId } from '@afri-market/kernel';
import { ServiceQuoteStatus } from './service-status';

export interface CreateServiceQuoteProps {
  readonly tenantId: TenantId;
  readonly requestId: EntityId;
  readonly vendorId: EntityId;
  readonly price: Money;
  readonly message?: string;
}

export interface ReconstituteServiceQuoteProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly requestId: EntityId;
  readonly vendorId: EntityId;
  readonly price: Money;
  readonly message: string;
  readonly status: ServiceQuoteStatus;
  readonly version: number;
}

export class ServiceQuote extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _requestId: EntityId,
    private readonly _vendorId: EntityId,
    private _price: Money,
    private _message: string,
    private _status: ServiceQuoteStatus,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateServiceQuoteProps): ServiceQuote {
    return new ServiceQuote(
      EntityId.create(), props.tenantId, props.requestId, props.vendorId,
      props.price, props.message ?? '', 'OPEN', 1,
    );
  }

  public static reconstitute(props: ReconstituteServiceQuoteProps): ServiceQuote {
    return new ServiceQuote(
      props.id, props.tenantId, props.requestId, props.vendorId,
      props.price, props.message, props.status, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get requestId(): EntityId { return this._requestId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get price(): Money { return this._price; }
  public get message(): string { return this._message; }
  public get status(): ServiceQuoteStatus { return this._status; }
  public get version(): number { return this._version; }

  public accept(): void {
    if (this._status !== 'OPEN') {
      throw new Error('Only open quotes can be accepted');
    }
    this._status = 'ACCEPTED';
  }

  public decline(): void {
    if (this._status !== 'OPEN') {
      throw new Error('Only open quotes can be declined');
    }
    this._status = 'DECLINED';
  }

  public toDto() {
    return {
      id: this.id.value,
      requestId: this._requestId.value,
      vendorId: this._vendorId.value,
      price: this._price.amount,
      currency: this._price.currency,
      message: this._message,
      status: this._status,
    };
  }
}
