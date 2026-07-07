import { DomainException } from '@abms/kernel';

export class TenantContextMissingException extends DomainException {
  public readonly code = 'DATABASE.TENANT_CONTEXT_MISSING';

  public constructor() {
    super('No tenant context is active for this transaction.');
  }
}
