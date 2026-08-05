import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { WalletsController } from './wallets.controller';
import { RolesGuard, ROLES_KEY } from '@afri-market/identity-infrastructure';
import {
  GetWalletUseCase,
  CreditWalletUseCase,
  DebitWalletUseCase,
  ListWalletTransactionsUseCase,
  FindVendorsUseCase,
} from '@afri-market/marketplace-application';
import { MobileMoneyService } from '@afri-market/integrations';

function makeCtx(role: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    getHandler: () => WalletsController.prototype.debit,
    getClass: () => WalletsController,
  } as unknown as ExecutionContext;
}

describe('WalletsController', () => {
  let module: TestingModule;

  beforeEach(async () => {
    const getWallet = {
      execute: jest.fn().mockResolvedValue({ id: 'w1', balance: 1000, pendingBalance: 0, currency: 'TZS' }),
    } as unknown as jest.Mocked<GetWalletUseCase>;
    const creditWallet = { execute: jest.fn() } as unknown as jest.Mocked<CreditWalletUseCase>;
    const debitWallet = {
      execute: jest.fn().mockResolvedValue({ walletId: 'w1', balance: 500 }),
    } as unknown as jest.Mocked<DebitWalletUseCase>;
    const listTransactions = {
      execute: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    } as unknown as jest.Mocked<ListWalletTransactionsUseCase>;
    const mobileMoney = { initiateStkPush: jest.fn() } as unknown as jest.Mocked<MobileMoneyService>;
    const findVendors = {
      findByUserId: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<FindVendorsUseCase>;
    const dataSource = { query: jest.fn().mockResolvedValue([]) } as any;

    module = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        { provide: GetWalletUseCase, useValue: getWallet },
        { provide: CreditWalletUseCase, useValue: creditWallet },
        { provide: DebitWalletUseCase, useValue: debitWallet },
        { provide: ListWalletTransactionsUseCase, useValue: listTransactions },
        { provide: MobileMoneyService, useValue: mobileMoney },
        { provide: FindVendorsUseCase, useValue: findVendors },
        { provide: getDataSourceToken(), useValue: dataSource },
        RolesGuard,
        { provide: Reflector, useValue: new Reflector() },
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module.get(WalletsController)).toBeDefined();
  });

  it('should decorate debit with Roles(admin)', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, (WalletsController.prototype as any).debit);
    expect(roles).toEqual(['admin']);
  });

  it('should forbid debit for customer', () => {
    const guard = module.get(RolesGuard);
    expect(guard.canActivate(makeCtx('customer'))).toBe(false);
  });

  it('should forbid debit for vendor', () => {
    const guard = module.get(RolesGuard);
    expect(guard.canActivate(makeCtx('vendor'))).toBe(false);
  });

  it('should allow debit for admin', () => {
    const guard = module.get(RolesGuard);
    expect(guard.canActivate(makeCtx('admin'))).toBe(true);
  });

  it('should allow debit for super_admin', () => {
    const guard = module.get(RolesGuard);
    expect(guard.canActivate(makeCtx('super_admin'))).toBe(true);
  });
});
