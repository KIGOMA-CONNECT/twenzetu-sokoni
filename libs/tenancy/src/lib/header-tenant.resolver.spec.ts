import type { Request } from 'express';
import { TenantResolutionException } from './tenant-resolution.exception';
import { HeaderTenantResolver } from './header-tenant.resolver';

function fakeRequest(headerValue: string | undefined): Request {
  return {
    header: () => headerValue,
  } as unknown as Request;
}

describe('HeaderTenantResolver', () => {
  const resolver = new HeaderTenantResolver();
  const validTenantId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

  it('resolves the tenant id from the x-tenant-id header', () => {
    expect(resolver.resolve(fakeRequest(validTenantId))).toBe(validTenantId);
  });

  it('throws when the header is missing', () => {
    expect(() => resolver.resolve(fakeRequest(undefined))).toThrow(TenantResolutionException);
  });

  it('throws when the header is not a valid UUID', () => {
    expect(() => resolver.resolve(fakeRequest('not-a-uuid'))).toThrow(TenantResolutionException);
  });
});
