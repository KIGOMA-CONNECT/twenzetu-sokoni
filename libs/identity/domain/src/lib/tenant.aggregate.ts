import { AggregateRoot, EntityId, Guard } from '@abms/kernel';
import { TenantStatus } from './tenant-status';

export interface CreateTenantProps {
  readonly name: string;
}

export interface ReconstituteTenantProps {
  readonly id: EntityId;
  readonly name: string;
  readonly status: TenantStatus;
}

/**
 * The owning row for `tenant_id` everywhere else in the system — deliberately
 * outside RLS (see ADR-0005), since tenant registration must run before any
 * tenant context exists.
 */
export class Tenant extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private _name: string,
    private _status: TenantStatus,
  ) {
    super(id);
  }

  public static create(props: CreateTenantProps): Tenant {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));

    return new Tenant(EntityId.create(), props.name, 'ACTIVE');
  }

  public static reconstitute(props: ReconstituteTenantProps): Tenant {
    return new Tenant(props.id, props.name, props.status);
  }

  public get name(): string {
    return this._name;
  }

  public get status(): TenantStatus {
    return this._status;
  }

  public rename(newName: string): void {
    Guard.assert(Guard.againstEmptyString(newName, 'name'));
    this._name = newName;
  }

  public suspend(): void {
    this._status = 'SUSPENDED';
  }

  public reactivate(): void {
    this._status = 'ACTIVE';
  }
}
