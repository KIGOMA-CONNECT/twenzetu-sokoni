import { UserRole } from '@abms/identity-domain';

export interface JwtPayload {
  readonly sub: string;
  readonly tenantId: string;
  readonly role: UserRole;
  readonly email: string;
}

export interface AuthenticatedRequestUser {
  readonly userId: string;
  readonly tenantId: string;
  readonly role: UserRole;
  readonly email: string;
}
