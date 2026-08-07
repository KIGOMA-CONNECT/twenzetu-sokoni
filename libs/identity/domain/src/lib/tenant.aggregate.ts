import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';
import { TenantStatus } from './tenant-status';

export interface CreateTenantProps {
  readonly name: string;
  readonly isDefault?: boolean;
}

export interface ReconstituteTenantProps {
  readonly id: EntityId;
  readonly name: string;
  readonly status: TenantStatus;
  readonly isDefault?: boolean;
}

export class Tenant extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private _name: string,
    private _status: TenantStatus,
    private _isDefault = false,
  ) {
    super(id);
  }

  public static create(props: CreateTenantProps): Tenant {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    return new Tenant(EntityId.create(), props.name, 'ACTIVE', props.isDefault ?? false);
  }

  public static reconstitute(props: ReconstituteTenantProps): Tenant {
    return new Tenant(props.id, props.name, props.status, props.isDefault ?? false);
  }

  public get name(): string { return this._name; }
  public get status(): TenantStatus { return this._status; }
  public get isDefault(): boolean { return this._isDefault; }

  public rename(newName: string): void {
    Guard.assert(Guard.againstEmptyString(newName, 'name'));
    this._name = newName;
  }

  public suspend(): void { this._status = 'SUSPENDED'; }
  public reactivate(): void { this._status = 'ACTIVE'; }
  public markAsDefault(): void { this._isDefault = true; }
}
