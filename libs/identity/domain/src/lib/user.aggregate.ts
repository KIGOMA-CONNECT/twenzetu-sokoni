import { AggregateRoot, Email, EntityId, Guard, TenantId } from '@abms/kernel';
import { UserRole } from './user-role';

export interface CreateUserProps {
  readonly tenantId: TenantId;
  readonly email: Email;
  readonly passwordHash: string;
  readonly role: UserRole;
}

export interface ReconstituteUserProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly email: Email;
  readonly passwordHash: string;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly version: number;
}

/**
 * Deliberately outside RLS (see ADR-0005) — login must find a user by email
 * before any tenant context is known. `email` is globally unique, not scoped
 * per tenant (a person's email doesn't belong to a tenant).
 */
export class User extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _email: Email,
    private _passwordHash: string,
    private _role: UserRole,
    private _isActive: boolean,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateUserProps): User {
    Guard.assert(Guard.againstEmptyString(props.passwordHash, 'passwordHash'));

    return new User(EntityId.create(), props.tenantId, props.email, props.passwordHash, props.role, true, 1);
  }

  public static reconstitute(props: ReconstituteUserProps): User {
    return new User(
      props.id,
      props.tenantId,
      props.email,
      props.passwordHash,
      props.role,
      props.isActive,
      props.version,
    );
  }

  public get tenantId(): TenantId {
    return this._tenantId;
  }

  public get email(): Email {
    return this._email;
  }

  public get passwordHash(): string {
    return this._passwordHash;
  }

  public get role(): UserRole {
    return this._role;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get version(): number {
    return this._version;
  }

  public changePasswordHash(newHash: string): void {
    Guard.assert(Guard.againstEmptyString(newHash, 'passwordHash'));
    this._passwordHash = newHash;
  }

  public changeRole(newRole: UserRole): void {
    this._role = newRole;
  }

  public deactivate(): void {
    this._isActive = false;
  }

  public reactivate(): void {
    this._isActive = true;
  }
}
