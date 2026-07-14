import { DomainException } from '@abms/kernel';

/**
 * Distinct from kernel's generic exceptions and tenancy's TenantResolutionException
 * (which maps to 400) — a missing/expired/invalid-signature JWT is a 401, not a
 * malformed-request 400. See ADR-0005.
 */
export class AuthenticationFailedException extends DomainException {
  public readonly code = 'AUTH.UNAUTHENTICATED';

  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
