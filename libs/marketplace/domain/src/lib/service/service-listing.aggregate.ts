import { AggregateRoot, EntityId, Guard, Money, TenantId } from '@afri-market/kernel';
import { ServicePricingModel } from './service-status';

export interface CreateServiceListingProps {
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly name: string;
  readonly description?: string;
  readonly category: string;
  readonly pricingModel: ServicePricingModel;
  readonly basePrice: Money;
  readonly unitLabel?: string;
  readonly imageUrl?: string;
}

export interface ReconstituteServiceListingProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly pricingModel: ServicePricingModel;
  readonly basePrice: Money;
  readonly unitLabel: string;
  readonly imageUrl: string | undefined;
  readonly isActive: boolean;
  readonly version: number;
}

export class ServiceListing extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _vendorId: EntityId,
    private _name: string,
    private _description: string,
    private _category: string,
    private _pricingModel: ServicePricingModel,
    private _basePrice: Money,
    private _unitLabel: string,
    private _imageUrl: string | undefined,
    private _isActive: boolean,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateServiceListingProps): ServiceListing {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    Guard.assert(Guard.againstEmptyString(props.category, 'category'));
    return new ServiceListing(
      EntityId.create(), props.tenantId, props.vendorId, props.name,
      props.description ?? '', props.category, props.pricingModel,
      props.basePrice, props.unitLabel ?? 'unit', props.imageUrl, true, 1,
    );
  }

  public static reconstitute(props: ReconstituteServiceListingProps): ServiceListing {
    return new ServiceListing(
      props.id, props.tenantId, props.vendorId, props.name,
      props.description, props.category, props.pricingModel,
      props.basePrice, props.unitLabel, props.imageUrl, props.isActive, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get name(): string { return this._name; }
  public get description(): string { return this._description; }
  public get category(): string { return this._category; }
  public get pricingModel(): ServicePricingModel { return this._pricingModel; }
  public get basePrice(): Money { return this._basePrice; }
  public get unitLabel(): string { return this._unitLabel; }
  public get imageUrl(): string | undefined { return this._imageUrl; }
  public get isActive(): boolean { return this._isActive; }
  public get version(): number { return this._version; }

  public activate(): void { this._isActive = true; }
  public deactivate(): void { this._isActive = false; }

  public toDto() {
    return {
      id: this.id.value,
      vendorId: this._vendorId.value,
      name: this._name,
      description: this._description,
      category: this._category,
      pricingModel: this._pricingModel,
      basePrice: this._basePrice.amount,
      currency: this._basePrice.currency,
      unitLabel: this._unitLabel,
      imageUrl: this._imageUrl,
      isActive: this._isActive,
    };
  }
}
