import { DomainException } from '@abms/kernel';

export class TenantResolutionException extends DomainException {
  public readonly code = 'TENANCY.RESOLUTION_FAILED';

  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
