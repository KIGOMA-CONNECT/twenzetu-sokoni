import { AggregateRoot, EntityId, Guard, TenantId } from '@afri-market/kernel';
import {
  VendorPermission,
  VendorStaffRole,
  defaultPermissionsForVendorRole,
  isVendorStaffRole,
} from './vendor-staff-role';

export type VendorMemberStatus = 'ACTIVE' | 'INACTIVE';

export interface CreateVendorMemberProps {
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly userId: EntityId;
  readonly role: VendorStaffRole;
  readonly permissions?: VendorPermission[];
}

export interface ReconstituteVendorMemberProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly vendorId: EntityId;
  readonly userId: EntityId;
  readonly role: VendorStaffRole;
  readonly permissions: VendorPermission[];
  readonly status: VendorMemberStatus;
  readonly version: number;
}

export class VendorMember extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _vendorId: EntityId,
    private readonly _userId: EntityId,
    private _role: VendorStaffRole,
    private _permissions: VendorPermission[],
    private _status: VendorMemberStatus,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateVendorMemberProps): VendorMember {
    Guard.assert(isVendorStaffRole(props.role), `Invalid vendor staff role: ${props.role}`);
    return new VendorMember(
      EntityId.create(),
      props.tenantId,
      props.vendorId,
      props.userId,
      props.role,
      props.permissions ?? defaultPermissionsForVendorRole(props.role),
      'ACTIVE',
      1,
    );
  }

  public static reconstitute(props: ReconstituteVendorMemberProps): VendorMember {
    return new VendorMember(
      props.id,
      props.tenantId,
      props.vendorId,
      props.userId,
      props.role,
      props.permissions,
      props.status,
      props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get vendorId(): EntityId { return this._vendorId; }
  public get userId(): EntityId { return this._userId; }
  public get role(): VendorStaffRole { return this._role; }
  public get permissions(): VendorPermission[] { return this._permissions; }
  public get status(): VendorMemberStatus { return this._status; }
  public get version(): number { return this._version; }

  public get isActive(): boolean {
    return this._status === 'ACTIVE';
  }

  public hasPermission(permission: VendorPermission): boolean {
    return this._permissions.includes(permission);
  }

  public changeRole(role: VendorStaffRole): void {
    Guard.assert(isVendorStaffRole(role), `Invalid vendor staff role: ${role}`);
    this._role = role;
    this._permissions = defaultPermissionsForVendorRole(role);
  }

  public updatePermissions(permissions: VendorPermission[]): void {
    this._permissions = [...new Set(permissions)];
  }

  public activate(): void { this._status = 'ACTIVE'; }
  public deactivate(): void { this._status = 'INACTIVE'; }

  public toDto() {
    return {
      id: this.id.value,
      vendorId: this._vendorId.value,
      userId: this._userId.value,
      role: this._role,
      permissions: this._permissions,
      status: this._status,
    };
  }
}
