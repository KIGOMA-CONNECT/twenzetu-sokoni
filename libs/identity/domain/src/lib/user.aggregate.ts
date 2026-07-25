import { AggregateRoot, Email, EntityId, Guard, TenantId } from '@afri-market/kernel';
import { PhoneNumber } from '@afri-market/kernel';
import { UserRole } from './user-role';
import { UserStatus } from './user-status';

export interface CreateUserProps {
  readonly tenantId: TenantId;
  readonly phoneNumber: PhoneNumber;
  readonly fullName: string;
  readonly role: UserRole;
  readonly passwordHash: string;
  readonly email?: Email;
}

export interface ReconstituteUserProps {
  readonly id: EntityId;
  readonly tenantId: TenantId;
  readonly phoneNumber: PhoneNumber;
  readonly fullName: string;
  readonly role: UserRole;
  readonly passwordHash: string;
  readonly email?: Email;
  readonly status: UserStatus;
  readonly version: number;
}

export class User extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private readonly _tenantId: TenantId,
    private readonly _phoneNumber: PhoneNumber,
    private _fullName: string,
    private _role: UserRole,
    private _passwordHash: string,
    private _email: Email | undefined,
    private _status: UserStatus,
    private readonly _version: number,
  ) {
    super(id);
  }

  public static create(props: CreateUserProps): User {
    Guard.assert(Guard.againstEmptyString(props.fullName, 'fullName'));
    Guard.assert(Guard.againstEmptyString(props.passwordHash, 'passwordHash'));
    return new User(
      EntityId.create(),
      props.tenantId,
      props.phoneNumber,
      props.fullName,
      props.role,
      props.passwordHash,
      props.email,
      'PENDING_VERIFICATION',
      1,
    );
  }

  public static reconstitute(props: ReconstituteUserProps): User {
    return new User(
      props.id, props.tenantId, props.phoneNumber, props.fullName,
      props.role, props.passwordHash, props.email, props.status, props.version,
    );
  }

  public get tenantId(): TenantId { return this._tenantId; }
  public get phoneNumber(): PhoneNumber { return this._phoneNumber; }
  public get fullName(): string { return this._fullName; }
  public get role(): UserRole { return this._role; }
  public get passwordHash(): string { return this._passwordHash; }
  public get email(): Email | undefined { return this._email; }
  public get status(): UserStatus { return this._status; }
  public get version(): number { return this._version; }

  public changePasswordHash(newHash: string): void {
    Guard.assert(Guard.againstEmptyString(newHash, 'passwordHash'));
    this._passwordHash = newHash;
  }

  public changeRole(newRole: UserRole): void { this._role = newRole; }
  public activate(): void { this._status = 'ACTIVE'; }
  public suspend(): void { this._status = 'SUSPENDED'; }
  public verify(): void { this._status = 'ACTIVE'; }
  public updateFullName(newName: string): void { this._fullName = newName; }
  public updateEmail(newEmail: Email | undefined): void { this._email = newEmail; }
}
