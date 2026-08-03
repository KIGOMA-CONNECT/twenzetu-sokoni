import { AggregateRoot, EntityId, Guard, TenantId } from '@abms/kernel';

export interface CreateOrgUnitTypeProps {
  readonly tenantId: TenantId;
  readonly code: string;
  readonly name: string;
  readonly description?: string | null;
  readonly isSystemDefined?: boolean;
  readonly sortOrder?: number;
  readonly allowedParentTypeIds?: ReadonlyArray<EntityId>;
}

export interface ReconstituteOrgUnitTypeProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly isSystemDefined: boolean;
  readonly isActive: boolean;
  readonly sortOrder: number;
  readonly allowedParentTypeIds: ReadonlyArray<EntityId>;
}

export class OrgUnitType extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private _code: string,
    private _name: string,
    private _description: string | null,
    private readonly _isSystemDefined: boolean,
    private _isActive: boolean,
    private _sortOrder: number,
    private readonly _allowedParentTypeIds: ReadonlyMap<string, EntityId>,
  ) {
    super(id);
  }

  public static create(props: CreateOrgUnitTypeProps): OrgUnitType {
    Guard.assert(Guard.againstEmptyString(props.code, 'code'));
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));

    return new OrgUnitType(
      EntityId.create(),
      props.tenantId,
      props.code,
      props.name,
      props.description ?? null,
      props.isSystemDefined ?? false,
      true,
      props.sortOrder ?? 0,
      OrgUnitType.toAllowedParentMap(props.allowedParentTypeIds ?? []),
    );
  }

  public static reconstitute(props: ReconstituteOrgUnitTypeProps): OrgUnitType {
    return new OrgUnitType(
      props.id,
      props.tenantId,
      props.code,
      props.name,
      props.description,
      props.isSystemDefined,
      props.isActive,
      props.sortOrder,
      OrgUnitType.toAllowedParentMap(props.allowedParentTypeIds),
    );
  }

  private static toAllowedParentMap(ids: ReadonlyArray<EntityId>): ReadonlyMap<string, EntityId> {
    return new Map(ids.map((id) => [id.toValue(), id]));
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get code(): string {
    return this._code;
  }

  public get name(): string {
    return this._name;
  }

  public get description(): string | null {
    return this._description;
  }

  public get isSystemDefined(): boolean {
    return this._isSystemDefined;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get sortOrder(): number {
    return this._sortOrder;
  }

  public get allowedParentTypeIds(): ReadonlyArray<EntityId> {
    return [...this._allowedParentTypeIds.values()];
  }

  public isRootType(): boolean {
    return this._allowedParentTypeIds.size === 0;
  }

  public allowsParentType(candidateParentTypeId: EntityId): boolean {
    return this._allowedParentTypeIds.has(candidateParentTypeId.toValue());
  }

  public rename(newName: string): void {
    Guard.assert(Guard.againstEmptyString(newName, 'name'));
    this._name = newName;
  }

  public updateDescription(description: string | null): void {
    this._description = description;
  }

  public deactivate(): void {
    this._isActive = false;
  }

  public activate(): void {
    this._isActive = true;
  }
}
