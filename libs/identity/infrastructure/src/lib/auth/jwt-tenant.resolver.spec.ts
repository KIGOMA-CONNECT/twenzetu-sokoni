import { AuthenticationFailedException } from '@abms/identity-domain';
import type { Request } from 'express';
import { JwtTenantResolver } from './jwt-tenant.resolver';

function fakeRequest(headerValue: string | undefined): Request {
  return { header: () => headerValue } as unknown as Request;
}

function fakeJwtService(overrides: Partial<{ verify: jest.Mock }> = {}) {
  return { verify: jest.fn(), ...overrides };
}

describe('JwtTenantResolver', () => {
  it('extracts tenantId from a valid, verified token', () => {
    const jwtService = fakeJwtService({ verify: jest.fn().mockReturnValue({ tenantId: 'tenant-a' }) });
    const resolver = new JwtTenantResolver(jwtService as never);

    const tenantId = resolver.resolve(fakeRequest('Bearer valid-token'));

    expect(tenantId).toBe('tenant-a');
    expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
  });

  it('throws AuthenticationFailedException when the Authorization header is missing', () => {
    const resolver = new JwtTenantResolver(fakeJwtService() as never);

    expect(() => resolver.resolve(fakeRequest(undefined))).toThrow(AuthenticationFailedException);
  });

  it('throws AuthenticationFailedException when the header is not a Bearer token', () => {
    const resolver = new JwtTenantResolver(fakeJwtService() as never);

    expect(() => resolver.resolve(fakeRequest('Basic abc123'))).toThrow(AuthenticationFailedException);
  });

  it('throws AuthenticationFailedException when the token fails verification', () => {
    const jwtService = fakeJwtService({
      verify: jest.fn().mockImplementation(() => {
        throw new Error('jwt expired');
      }),
    });
    const resolver = new JwtTenantResolver(jwtService as never);

    expect(() => resolver.resolve(fakeRequest('Bearer expired-token'))).toThrow(
      AuthenticationFailedException,
    );
  });
});
