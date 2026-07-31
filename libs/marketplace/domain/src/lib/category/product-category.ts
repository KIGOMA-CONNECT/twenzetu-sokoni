import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';

export interface CreateCategoryProps {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly type: string;
  readonly parentId?: EntityId;
  readonly imageUrl?: string;
}

export interface ReconstituteCategoryProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly type: string;
  readonly parentId: EntityId | undefined;
  readonly imageUrl: string | undefined;
  readonly isActive: boolean;
}

export class ProductCategory extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private _name: string,
    private _type: string,
    private readonly _parentId: EntityId | undefined,
    private _imageUrl: string | undefined,
    private _isActive: boolean,
  ) {
    super(id);
  }

  public static create(props: CreateCategoryProps): ProductCategory {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    return new ProductCategory(
      EntityId.create(), props.tenantId, props.name,
      props.type, props.parentId, props.imageUrl, true,
    );
  }

  public static reconstitute(props: ReconstituteCategoryProps): ProductCategory {
    return new ProductCategory(
      props.id, props.tenantId, props.name, props.type,
      props.parentId, props.imageUrl, props.isActive,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get name(): string { return this._name; }
  public get type(): string { return this._type; }
  public get parentId(): EntityId | undefined { return this._parentId; }
  public get imageUrl(): string | undefined { return this._imageUrl; }
  public get isActive(): boolean { return this._isActive; }

  public deactivate(): void { this._isActive = false; }
  public activate(): void { this._isActive = true; }

  public toDto() {
    return {
      id: this.id.value,
      name: this._name,
      type: this._type,
      parentId: this._parentId?.value ?? null,
      imageUrl: this._imageUrl ?? null,
      isActive: this._isActive,
    };
  }
}
