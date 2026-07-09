import { AggregateRoot, BusinessRuleViolationException, EntityId, Guard, TenantId } from '@abms/kernel';
import { OrgUnitDeactivatedEvent } from './events/org-unit-deactivated.event';
import { OrgUnitCreatedEvent } from './events/org-unit-created.event';
import { OrgUnitMovedEvent } from './events/org-unit-moved.event';
import { OrgUnitReactivatedEvent } from './events/org-unit-reactivated.event';
import { OrgUnitRenamedEvent } from './events/org-unit-renamed.event';
import { OrgUnitStatus } from './org-unit-status';

export interface CreateOrgUnitProps {
  readonly tenantId: TenantId;
  readonly orgUnitTypeId: EntityId;
  readonly parentId: EntityId | null;
  readonly code: string;
  readonly name: string;
  readonly sortOrder?: number;
}

export interface ReconstituteOrgUnitProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly orgUnitTypeId: EntityId;
  readonly parentId: EntityId | null;
  readonly code: string;
  readonly name: string;
  readonly status: OrgUnitStatus;
  readonly sortOrder: number;
  readonly version: number;
}

export class OrgUnit extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _orgUnitTypeId: EntityId,
    private _parentId: EntityId | null,
    private _code: string,
    private _name: string,
    private _status: OrgUnitStatus,
    private _sortOrder: number,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateOrgUnitProps): OrgUnit {
    Guard.assert(Guard.againstEmptyString(props.code, 'code'));
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));

    const orgUnit = new OrgUnit(
      EntityId.create(),
      props.tenantId,
      props.orgUnitTypeId,
      props.parentId,
      props.code,
      props.name,
      'ACTIVE',
      props.sortOrder ?? 0,
      1,
    );

    orgUnit.addDomainEvent(
      new OrgUnitCreatedEvent(
        orgUnit.id.toValue(),
        props.tenantId.value,
        props.orgUnitTypeId.toValue(),
        props.parentId?.toValue() ?? null,
      ),
    );

    return orgUnit;
  }

  public static reconstitute(props: ReconstituteOrgUnitProps): OrgUnit {
    return new OrgUnit(
      props.id,
      props.tenantId,
      props.orgUnitTypeId,
      props.parentId,
      props.code,
      props.name,
      props.status,
      props.sortOrder,
      props.version,
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get orgUnitTypeId(): EntityId {
    return this._orgUnitTypeId;
  }

  public get parentId(): EntityId | null {
    return this._parentId;
  }

  public get code(): string {
    return this._code;
  }

  public get name(): string {
    return this._name;
  }

  public get status(): OrgUnitStatus {
    return this._status;
  }

  public get sortOrder(): number {
    return this._sortOrder;
  }

  public get version(): number {
    return this._version;
  }

  public rename(newName: string): void {
    Guard.assert(Guard.againstEmptyString(newName, 'name'));
    if (newName === this._name) {
      return;
    }
    const previousName = this._name;
    this._name = newName;
    this.addDomainEvent(
      new OrgUnitRenamedEvent(this.id.toValue(), this._tenantId.value, previousName, newName),
    );
  }

  // wouldCreateCycle must be pre-computed by the caller via a closure-table lookup (this pure domain method has no way to query it itself).
  public reparent(newParentId: EntityId | null, wouldCreateCycle: boolean): void {
    if (wouldCreateCycle) {
      throw new BusinessRuleViolationException(
        `Cannot move org unit "${this._name}" under itself or one of its own descendants.`,
      );
    }
    const isUnchanged =
      (newParentId === null && this._parentId === null) ||
      (newParentId !== null && this._parentId !== null && newParentId.equals(this._parentId));
    if (isUnchanged) {
      return;
    }
    const previousParentId = this._parentId;
    this._parentId = newParentId;
    this.addDomainEvent(
      new OrgUnitMovedEvent(
        this.id.toValue(),
        this._tenantId.value,
        previousParentId?.toValue() ?? null,
        newParentId?.toValue() ?? null,
      ),
    );
  }

  public deactivate(): void {
    if (this._status === 'INACTIVE') {
      return;
    }
    this._status = 'INACTIVE';
    this.addDomainEvent(new OrgUnitDeactivatedEvent(this.id.toValue(), this._tenantId.value));
  }

  public reactivate(): void {
    if (this._status === 'ACTIVE') {
      return;
    }
    this._status = 'ACTIVE';
    this.addDomainEvent(new OrgUnitReactivatedEvent(this.id.toValue(), this._tenantId.value));
  }
}
