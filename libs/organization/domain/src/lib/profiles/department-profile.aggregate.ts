import { AggregateRoot, EntityId, TenantId } from '@abms/kernel';

export interface CreateDepartmentProfileProps {
  readonly tenantId: TenantId;
  readonly orgUnitId: EntityId;
  readonly costCenterOrgUnitId?: EntityId | null;
  readonly managerReference?: string | null;
}

export interface ReconstituteDepartmentProfileProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly orgUnitId: EntityId;
  readonly costCenterOrgUnitId: EntityId | null;
  readonly managerReference: string | null;
  readonly version: number;
}

export interface UpdateDepartmentProfileProps {
  readonly costCenterOrgUnitId?: EntityId | null;
  readonly managerReference?: string | null;
}

/**
 * Type-specific extension data attached 1:1 to an OrgUnit of type DEPARTMENT. See ADR-0004.
 * `managerReference` is an explicit stopgap plain string pending a future Identity/User module.
 */
export class DepartmentProfile extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _orgUnitId: EntityId,
    private _costCenterOrgUnitId: EntityId | null,
    private _managerReference: string | null,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateDepartmentProfileProps): DepartmentProfile {
    return new DepartmentProfile(
      EntityId.create(),
      props.tenantId,
      props.orgUnitId,
      props.costCenterOrgUnitId ?? null,
      props.managerReference?.trim() ?? null,
      1,
    );
  }

  public static reconstitute(props: ReconstituteDepartmentProfileProps): DepartmentProfile {
    return new DepartmentProfile(
      props.id,
      props.tenantId,
      props.orgUnitId,
      props.costCenterOrgUnitId,
      props.managerReference,
      props.version,
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get orgUnitId(): EntityId {
    return this._orgUnitId;
  }

  public get costCenterOrgUnitId(): EntityId | null {
    return this._costCenterOrgUnitId;
  }

  public get managerReference(): string | null {
    return this._managerReference;
  }

  public get version(): number {
    return this._version;
  }

  public update(props: UpdateDepartmentProfileProps): void {
    this._costCenterOrgUnitId = props.costCenterOrgUnitId ?? null;
    this._managerReference = props.managerReference?.trim() ?? null;
  }
}
