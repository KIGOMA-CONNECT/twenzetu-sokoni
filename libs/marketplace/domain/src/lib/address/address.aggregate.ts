import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';

export interface CreateAddressProps {
  readonly tenantId: TenantId;
  readonly userId: EntityId;
  readonly label: string;
  readonly fullAddress: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly isDefault?: boolean;
}

export interface ReconstituteAddressProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly userId: EntityId;
  readonly label: string;
  readonly fullAddress: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly isDefault: boolean;
}

export class Address extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _userId: EntityId,
    private _label: string,
    private _fullAddress: string,
    private _latitude: number,
    private _longitude: number,
    private _isDefault: boolean,
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
    );
  }

  public static reconstitute(props: ReconstituteAddressProps): Address {
    return new Address(
      props.id, props.tenantId, props.userId,
      props.label, props.fullAddress, props.latitude, props.longitude,
      props.isDefault,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get userId(): EntityId { return this._userId; }
  public get label(): string { return this._label; }
  public get fullAddress(): string { return this._fullAddress; }
  public get latitude(): number { return this._latitude; }
  public get longitude(): number { return this._longitude; }
  public get isDefault(): boolean { return this._isDefault; }

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
    };
  }
}
