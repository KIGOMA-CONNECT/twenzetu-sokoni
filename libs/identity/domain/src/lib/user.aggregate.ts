import { AggregateRoot, Email, EntityId, Guard, TenantId } from '@afri-market/kernel';
import { PhoneNumber } from '@afri-market/kernel';
import { UserRole, AdminPermission, defaultPermissionsForRole } from './user-role';
import { UserStatus } from './user-status';

export type VerificationDocumentStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreateUserProps {
  readonly tenantId: TenantId;
  readonly phoneNumber: PhoneNumber;
  readonly fullName: string;
  readonly role: UserRole;
  readonly passwordHash: string;
  readonly email?: Email;
  readonly permissions?: AdminPermission[];
  readonly businessName?: string;
  readonly ninOrRegNo?: string;
  readonly city?: string;
  readonly verificationRiskScore?: number;
  readonly verificationDocumentStatus?: VerificationDocumentStatus;
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
  readonly permissions?: AdminPermission[];
  readonly businessName?: string;
  readonly ninOrRegNo?: string;
  readonly city?: string;
  readonly verificationRiskScore?: number;
  readonly verificationDocumentStatus?: VerificationDocumentStatus;
  readonly rejectionReason?: string;
  readonly verifiedAt?: Date;
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
    private _permissions: AdminPermission[] = [],
    private _businessName: string | undefined,
    private _ninOrRegNo: string | undefined,
    private _city: string | undefined,
    private _verificationRiskScore: number | undefined,
    private _verificationDocumentStatus: VerificationDocumentStatus | undefined,
    private _rejectionReason: string | undefined,
    private _verifiedAt: Date | undefined,
  ) {
    super(id);
  }

  public static create(props: CreateUserProps): User {
    Guard.assert(Guard.againstEmptyString(props.fullName, 'fullName'));
    Guard.assert(Guard.againstEmptyString(props.passwordHash, 'passwordHash'));
    // Admin/super_admin roles get their permission set automatically so the
    // admin console is usable on first login instead of returning 403.
    const permissions = props.permissions ?? defaultPermissionsForRole(props.role);
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
      permissions,
      props.businessName,
      props.ninOrRegNo,
      props.city,
      props.verificationRiskScore,
      props.verificationDocumentStatus,
      undefined,
      undefined,
    );
  }

  public static reconstitute(props: ReconstituteUserProps): User {
    return new User(
      props.id, props.tenantId, props.phoneNumber, props.fullName,
      props.role, props.passwordHash, props.email, props.status, props.version,
      props.permissions ?? [],
      props.businessName,
      props.ninOrRegNo,
      props.city,
      props.verificationRiskScore,
      props.verificationDocumentStatus,
      props.rejectionReason,
      props.verifiedAt,
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
  public get permissions(): AdminPermission[] { return this._permissions; }
  public get businessName(): string | undefined { return this._businessName; }
  public get ninOrRegNo(): string | undefined { return this._ninOrRegNo; }
  public get city(): string | undefined { return this._city; }
  public get verificationRiskScore(): number | undefined { return this._verificationRiskScore; }
  public get verificationDocumentStatus(): VerificationDocumentStatus | undefined {
    return this._verificationDocumentStatus;
  }
  public get rejectionReason(): string | undefined { return this._rejectionReason; }
  public get verifiedAt(): Date | undefined { return this._verifiedAt; }

  public changePasswordHash(newHash: string): void {
    Guard.assert(Guard.againstEmptyString(newHash, 'passwordHash'));
    this._passwordHash = newHash;
  }

  public changeRole(newRole: UserRole): void { this._role = newRole; }
  public activate(): void { this._status = 'ACTIVE'; }
  public suspend(): void { this._status = 'SUSPENDED'; }
  public verify(): void {
    this._status = 'ACTIVE';
    this._verifiedAt = new Date();
    this._verificationDocumentStatus = this._verificationDocumentStatus ?? 'APPROVED';
  }

  public recordAiVerification(riskScore: number, documentStatus: VerificationDocumentStatus): void {
    Guard.inRange(riskScore, 0, 100, 'verificationRiskScore');
    this._verificationRiskScore = riskScore;
    this._verificationDocumentStatus = documentStatus;
  }

  public approveVerification(): void {
    this._status = 'ACTIVE';
    this._verificationDocumentStatus = 'APPROVED';
    this._verifiedAt = new Date();
    this._rejectionReason = undefined;
  }

  public rejectVerification(reason: string): void {
    Guard.assert(Guard.againstEmptyString(reason, 'rejectionReason'));
    this._status = 'REJECTED';
    this._verificationDocumentStatus = 'REJECTED';
    this._rejectionReason = reason;
  }

  public updateFullName(newName: string): void { this._fullName = newName; }
  public updateEmail(newEmail: Email | undefined): void { this._email = newEmail; }
  public setPermissions(permissions: AdminPermission[]): void { this._permissions = permissions; }
}
