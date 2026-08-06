import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { ReferralsController } from './referrals.controller';
import { RolesGuard, ROLES_KEY } from '@afri-market/identity-infrastructure';

function makeCtx(role: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    getHandler: () => (ReferralsController.prototype as any).completeReferral,
    getClass: () => ReferralsController,
  } as unknown as ExecutionContext;
}

describe('ReferralsController', () => {
  let module: TestingModule;

  beforeEach(async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([]) } as any;

    module = await Test.createTestingModule({
      controllers: [ReferralsController],
      providers: [
        { provide: getDataSourceToken(), useValue: dataSource },
        RolesGuard,
        { provide: Reflector, useValue: new Reflector() },
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module.get(ReferralsController)).toBeDefined();
  });

  it('should decorate completeReferral with Roles(admin)', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, (ReferralsController.prototype as any).completeReferral);
    expect(roles).toEqual(['admin']);
  });

  it('should forbid completeReferral for customer', () => {
    const guard = module.get(RolesGuard);
    expect(guard.canActivate(makeCtx('customer'))).toBe(false);
  });

  it('should forbid completeReferral for vendor', () => {
    const guard = module.get(RolesGuard);
    expect(guard.canActivate(makeCtx('vendor'))).toBe(false);
  });

  it('should allow completeReferral for admin', () => {
    const guard = module.get(RolesGuard);
    expect(guard.canActivate(makeCtx('admin'))).toBe(true);
  });

  it('should allow completeReferral for super_admin', () => {
    const guard = module.get(RolesGuard);
    expect(guard.canActivate(makeCtx('super_admin'))).toBe(true);
  });
});
