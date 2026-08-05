import type { Request } from 'express';
import { HeaderTenantResolver } from './header-tenant.resolver';

function fakeRequest(headers: Record<string, string | string[] | undefined>): Request {
  return { headers } as unknown as Request;
}

describe('HeaderTenantResolver', () => {
  const resolver = new HeaderTenantResolver();

  it('resolves the tenant id from the x-tenant-id header', async () => {
    const result = await resolver.resolve(fakeRequest({ 'x-tenant-id': 'tenant-a' }));

    expect(result).toBe('tenant-a');
  });

  it('trims surrounding whitespace', async () => {
    const result = await resolver.resolve(fakeRequest({ 'x-tenant-id': '  tenant-a  ' }));

    expect(result).toBe('tenant-a');
  });

  it('returns null when the header is missing', async () => {
    const result = await resolver.resolve(fakeRequest({}));

    expect(result).toBeNull();
  });

  it('returns null when the header is empty or whitespace-only', async () => {
    const result = await resolver.resolve(fakeRequest({ 'x-tenant-id': '   ' }));

    expect(result).toBeNull();
  });
});
