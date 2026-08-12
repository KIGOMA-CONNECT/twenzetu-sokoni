import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';

export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface CreateSupplierProps {
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly name: string;
  readonly phone?: string;
  readonly contactPerson?: string;
  readonly notes?: string;
  readonly linkedVendorId?: string;
}

export interface ReconstituteSupplierProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly name: string;
  readonly phone: string | undefined;
  readonly contactPerson: string | undefined;
  readonly notes: string | undefined;
  readonly linkedVendorId: string | undefined;
  readonly status: SupplierStatus;
  readonly version: number;
}

export interface SupplierDto {
  id: string;
  vendorId: string;
  name: string;
  phone: string | null;
  contactPerson: string | null;
  notes: string | null;
  linkedVendorId: string | null;
  status: SupplierStatus;
  createdAt: string;
}

export class Supplier extends AggregateRoot<EntityId> {
  constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _vendorId: EntityId,
    private _name: string,
    private _phone: string | undefined,
    private _contactPerson: string | undefined,
    private _notes: string | undefined,
    private _linkedVendorId: string | undefined,
    private _status: SupplierStatus,
    private readonly _version: number,
    private readonly _createdAt: Date,
  ) {
    super(id);
  }

  public static create(props: CreateSupplierProps): Supplier {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    return new Supplier(
      EntityId.create(), props.tenantId, props.vendorId, props.name,
      props.phone, props.contactPerson, props.notes, props.linkedVendorId,
      'ACTIVE', 1, new Date(),
    );
  }

  public static reconstitute(props: ReconstituteSupplierProps, createdAt: Date = new Date()): Supplier {
    return new Supplier(
      props.id, props.tenantId, props.vendorId, props.name,
      props.phone, props.contactPerson, props.notes, props.linkedVendorId,
      props.status, props.version, createdAt,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get name(): string { return this._name; }
  public get phone(): string | undefined { return this._phone; }
  public get contactPerson(): string | undefined { return this._contactPerson; }
  public get notes(): string | undefined { return this._notes; }
  public get linkedVendorId(): string | undefined { return this._linkedVendorId; }
  public get status(): SupplierStatus { return this._status; }
  public get version(): number { return this._version; }
  public get createdAt(): Date { return this._createdAt; }

  public deactivate(): void {
    this._status = 'INACTIVE';
  }

  public toDto(): SupplierDto {
    return {
      id: this.id.value,
      vendorId: this._vendorId.value,
      name: this._name,
      phone: this._phone ?? null,
      contactPerson: this._contactPerson ?? null,
      notes: this._notes ?? null,
      linkedVendorId: this._linkedVendorId ?? null,
      status: this._status,
      createdAt: this._createdAt.toISOString(),
    };
  }
}