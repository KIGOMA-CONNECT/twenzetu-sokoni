import { DomainException } from '@abms/kernel';
import { TenantContextMissingException } from './tenant-context-missing.exception';

describe('TenantContextMissingException', () => {
  it('is a DomainException with a stable machine-readable code', () => {
    const exception = new TenantContextMissingException();

    expect(exception).toBeInstanceOf(DomainException);
    expect(exception.code).toBe('DATABASE.TENANT_CONTEXT_MISSING');
    expect(exception.message).toBe('No tenant context is active for this transaction.');
  });
});
