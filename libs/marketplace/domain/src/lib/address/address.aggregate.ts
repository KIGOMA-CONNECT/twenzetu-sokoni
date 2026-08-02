import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';

export interface CreateAddressProps {
  readonly tenantId: TenantId;
  readonly userId: EntityId;
  readonly label: string;
  readonly fullAddress: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly isDefault?: boolean;
  readonly country?: string;
  readonly region?: string;
  readonly city?: string;
  readonly district?: string;
  readonly street?: string;
  readonly landmark?: string;
  readonly postalCode?: string;
  readonly notes?: string;
}

export interface ReconstituteAddressProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly userId: EntityId;
  readonly label: string;
  readonly fullAddress: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly isDefault: boolean;
  readonly country?: string;
  readonly region?: string;
  readonly city?: string;
  readonly district?: string;
  readonly street?: string;
  readonly landmark?: string;
  readonly postalCode?: string;
  readonly notes?: string;
}

export class Address extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _userId: EntityId,
    private _label: string,
    private _fullAddress: string,
    private _latitude: number | undefined,
    private _longitude: number | undefined,
    private _isDefault: boolean,
    private _country: string,
    private _region: string | undefined,
    private _city: string | undefined,
    private _district: string | undefined,
    private _street: string | undefined,
    private _landmark: string | undefined,
    private _postalCode: string | undefined,
    private _notes: string | undefined,
  ) {
    super(id);
  }

  public static create(props: CreateAddressProps): Address {
    Guard.assert(Guard.againstEmptyString(props.label, 'label'));
    Guard.assert(Guard.againstEmptyString(props.fullAddress, 'fullAddress'));
    return new Address(
      EntityId.create(), props.tenantId, props.userId,
      props.label, props.fullAddress, props.latitude, props.longitude,
      props.isDefault ?? false,
      props.country ?? 'TZ', props.region, props.city, props.district,
      props.street, props.landmark, props.postalCode, props.notes,
    );
  }

  public static reconstitute(props: ReconstituteAddressProps): Address {
    return new Address(
      props.id, props.tenantId, props.userId,
      props.label, props.fullAddress, props.latitude, props.longitude,
      props.isDefault,
      props.country ?? 'TZ', props.region, props.city, props.district,
      props.street, props.landmark, props.postalCode, props.notes,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get userId(): EntityId { return this._userId; }
  public get label(): string { return this._label; }
  public get fullAddress(): string { return this._fullAddress; }
  public get latitude(): number | undefined { return this._latitude; }
  public get longitude(): number | undefined { return this._longitude; }
  public get isDefault(): boolean { return this._isDefault; }
  public get country(): string { return this._country; }
  public get region(): string | undefined { return this._region; }
  public get city(): string | undefined { return this._city; }
  public get district(): string | undefined { return this._district; }
  public get street(): string | undefined { return this._street; }
  public get landmark(): string | undefined { return this._landmark; }
  public get postalCode(): string | undefined { return this._postalCode; }
  public get notes(): string | undefined { return this._notes; }

  public setDefault(): void { this._isDefault = true; }
  public unsetDefault(): void { this._isDefault = false; }

  public toDto() {
    return {
      id: this.id.value,
      userId: this._userId.value,
      label: this._label,
      fullAddress: this._fullAddress,
      latitude: this._latitude,
      longitude: this._longitude,
      isDefault: this._isDefault,
      country: this._country,
      region: this._region,
      city: this._city,
      district: this._district,
      street: this._street,
      landmark: this._landmark,
      postalCode: this._postalCode,
      notes: this._notes,
    };
  }
}
