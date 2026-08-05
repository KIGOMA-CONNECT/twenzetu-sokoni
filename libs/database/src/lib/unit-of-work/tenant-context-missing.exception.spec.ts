import { TenantContextMissingException } from './tenant-context-missing.exception';

describe('TenantContextMissingException', () => {
  it('is an Error with a descriptive message about the missing tenant context', () => {
    const exception = new TenantContextMissingException();

    expect(exception).toBeInstanceOf(Error);
    expect(exception.name).toBe('TenantContextMissingException');
    expect(exception.message).toContain('Tenant context is missing');
  });
});
