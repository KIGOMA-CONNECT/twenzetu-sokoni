import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequestUser } from './jwt-payload.interface';
import { RolesGuard } from './roles.guard';

function fakeContext(user: AuthenticatedRequestUser | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function fakeReflector(requiredRoles: string[] | undefined): Reflector {
  return { getAllAndOverride: () => requiredRoles } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('allows the request when no roles are required', () => {
    const guard = new RolesGuard(fakeReflector(undefined));

    expect(guard.canActivate(fakeContext(undefined))).toBe(true);
  });

  it('allows the request when the user has a required role', () => {
    const guard = new RolesGuard(fakeReflector(['CEO']));
    const user: AuthenticatedRequestUser = {
      userId: 'u1',
      tenantId: 't1',
      role: 'CEO',
      email: 'ceo@afribiz.co.tz',
    };

    expect(guard.canActivate(fakeContext(user))).toBe(true);
  });

  it('rejects the request when the user has a different role', () => {
    const guard = new RolesGuard(fakeReflector(['CEO']));
    const user: AuthenticatedRequestUser = {
      userId: 'u1',
      tenantId: 't1',
      role: 'TEAM_MEMBER',
      email: 'member@afribiz.co.tz',
    };

    expect(guard.canActivate(fakeContext(user))).toBe(false);
  });

  it('rejects the request when there is no authenticated user', () => {
    const guard = new RolesGuard(fakeReflector(['CEO']));

    expect(guard.canActivate(fakeContext(undefined))).toBe(false);
  });
});
