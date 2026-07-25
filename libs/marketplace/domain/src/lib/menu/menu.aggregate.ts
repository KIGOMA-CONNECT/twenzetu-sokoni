import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';

export interface CreateMenuProps {
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly name: string;
  readonly description?: string;
  readonly availableFrom?: string;
  readonly availableUntil?: string;
}

export interface ReconstituteMenuProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly name: string;
  readonly description: string | undefined;
  readonly availableFrom: string | undefined;
  readonly availableUntil: string | undefined;
  readonly isActive: boolean;
}

export class Menu extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _vendorId: EntityId,
    private _name: string,
    private _description: string | undefined,
    private _availableFrom: string | undefined,
    private _availableUntil: string | undefined,
    private _isActive: boolean,
  ) {
    super(id);
  }

  public static create(props: CreateMenuProps): Menu {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    return new Menu(
      EntityId.create(), props.tenantId, props.vendorId,
      props.name, props.description, props.availableFrom,
      props.availableUntil, true,
    );
  }

  public static reconstitute(props: ReconstituteMenuProps): Menu {
    return new Menu(
      props.id, props.tenantId, props.vendorId, props.name,
      props.description, props.availableFrom, props.availableUntil,
      props.isActive,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get name(): string { return this._name; }
  public get description(): string | undefined { return this._description; }
  public get availableFrom(): string | undefined { return this._availableFrom; }
  public get availableUntil(): string | undefined { return this._availableUntil; }
  public get isActive(): boolean { return this._isActive; }

  public deactivate(): void { this._isActive = false; }
  public activate(): void { this._isActive = true; }
}
