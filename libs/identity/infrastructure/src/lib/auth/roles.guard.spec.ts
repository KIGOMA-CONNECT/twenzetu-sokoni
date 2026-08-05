import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

interface AuthUser {
  role: string;
}

function fakeContext(user: AuthUser | undefined): ExecutionContext {
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
    const guard = new RolesGuard(fakeReflector(['admin']));
    const user: AuthUser = { role: 'admin' };

    expect(guard.canActivate(fakeContext(user))).toBe(true);
  });

  it('allows any admin role when the admin role is required', () => {
    const guard = new RolesGuard(fakeReflector(['admin']));
    const user: AuthUser = { role: 'finance_admin' };

    expect(guard.canActivate(fakeContext(user))).toBe(true);
  });

  it('always allows a super_admin', () => {
    const guard = new RolesGuard(fakeReflector(['support_admin']));
    const user: AuthUser = { role: 'super_admin' };

    expect(guard.canActivate(fakeContext(user))).toBe(true);
  });

  it('rejects the request when the user has a different role', () => {
    const guard = new RolesGuard(fakeReflector(['admin']));
    const user: AuthUser = { role: 'customer' };

    expect(guard.canActivate(fakeContext(user))).toBe(false);
  });

  it('rejects the request when there is no authenticated user', () => {
    const guard = new RolesGuard(fakeReflector(['admin']));

    expect(guard.canActivate(fakeContext(undefined))).toBe(false);
  });
});
