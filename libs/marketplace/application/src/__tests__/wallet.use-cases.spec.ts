import { CreditWalletUseCase } from '../lib/use-cases/wallet/credit-wallet.use-case';
import { DebitWalletUseCase } from '../lib/use-cases/wallet/debit-wallet.use-case';
import { GetWalletUseCase } from '../lib/use-cases/wallet/get-wallet.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Wallet } from '@afri-market/marketplace-domain';

describe('CreditWalletUseCase', () => {
  let useCase: CreditWalletUseCase;
  let mockWalletRepo: Record<string, jest.Mock>;
  let mockTxRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';
  const OWNER_ID = 'owner-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletRepo = { findByOwnerId: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    mockTxRepo = { save: jest.fn().mockResolvedValue(undefined) };
    useCase = new CreditWalletUseCase(mockWalletRepo, mockTxRepo);
  });

  it('should create wallet and credit when no wallet exists', async () => {
    mockWalletRepo.findByOwnerId.mockResolvedValue(null);

    const result = await useCase.execute(TENANT_ID, OWNER_ID, 5000, 'Top up');

    expect(result.balance).toBe(5000);
    expect(mockWalletRepo.save).toHaveBeenCalledTimes(1);
    expect(mockTxRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should credit existing wallet', async () => {
    const wallet = Wallet.reconstitute({
      id: EntityId.from('w1'),
      tenantId: TenantId.create(TENANT_ID),
      ownerId: EntityId.from(OWNER_ID),
      ownerType: 'vendor',
      balance: Money.create(3000),
      pendingBalance: Money.create(0),
      version: 1,
    });
    mockWalletRepo.findByOwnerId.mockResolvedValue(wallet);

    const result = await useCase.execute(TENANT_ID, OWNER_ID, 2000, 'Bonus');

    expect(result.balance).toBe(5000);
    expect(mockWalletRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw if amount is zero or negative', async () => {
    await expect(useCase.execute(TENANT_ID, OWNER_ID, 0, 'Bad')).rejects.toThrow('positive');
    await expect(useCase.execute(TENANT_ID, OWNER_ID, -100, 'Bad')).rejects.toThrow('positive');
  });
});

describe('DebitWalletUseCase', () => {
  let useCase: DebitWalletUseCase;
  let mockWalletRepo: Record<string, jest.Mock>;
  let mockTxRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';
  const OWNER_ID = 'owner-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletRepo = { findByOwnerId: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    mockTxRepo = { save: jest.fn().mockResolvedValue(undefined) };
    useCase = new DebitWalletUseCase(mockWalletRepo, mockTxRepo);
  });

  it('should debit wallet successfully', async () => {
    const wallet = Wallet.reconstitute({
      id: EntityId.from('w1'),
      tenantId: TenantId.create(TENANT_ID),
      ownerId: EntityId.from(OWNER_ID),
      ownerType: 'vendor',
      balance: Money.create(10000),
      pendingBalance: Money.create(0),
      version: 1,
    });
    mockWalletRepo.findByOwnerId.mockResolvedValue(wallet);

    const result = await useCase.execute(TENANT_ID, OWNER_ID, 3000, 'Payment');

    expect(result.balance).toBe(7000);
    expect(mockWalletRepo.save).toHaveBeenCalledTimes(1);
    expect(mockTxRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw if wallet not found', async () => {
    mockWalletRepo.findByOwnerId.mockResolvedValue(null);

    await expect(useCase.execute(TENANT_ID, OWNER_ID, 1000, 'Pay')).rejects.toThrow('Wallet not found');
  });

  it('should throw if insufficient balance', async () => {
    const wallet = Wallet.reconstitute({
      id: EntityId.from('w1'),
      tenantId: TenantId.create(TENANT_ID),
      ownerId: EntityId.from(OWNER_ID),
      ownerType: 'vendor',
      balance: Money.create(100),
      pendingBalance: Money.create(0),
      version: 1,
    });
    mockWalletRepo.findByOwnerId.mockResolvedValue(wallet);

    await expect(useCase.execute(TENANT_ID, OWNER_ID, 500, 'Pay')).rejects.toThrow('Insufficient');
  });

  it('should throw if amount is zero or negative', async () => {
    await expect(useCase.execute(TENANT_ID, OWNER_ID, 0, 'Bad')).rejects.toThrow('positive');
  });
});

describe('GetWalletUseCase', () => {
  let useCase: GetWalletUseCase;
  let mockWalletRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';
  const OWNER_ID = 'owner-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockWalletRepo = { findByOwnerId: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
    useCase = new GetWalletUseCase(mockWalletRepo);
  });

  it('should return existing wallet', async () => {
    const wallet = Wallet.reconstitute({
      id: EntityId.from('w1'),
      tenantId: TenantId.create(TENANT_ID),
      ownerId: EntityId.from(OWNER_ID),
      ownerType: 'vendor',
      balance: Money.create(7000),
      pendingBalance: Money.create(500),
      version: 1,
    });
    mockWalletRepo.findByOwnerId.mockResolvedValue(wallet);

    const result = await useCase.execute(TENANT_ID, OWNER_ID);

    expect(result.id).toBe('w1');
    expect(result.balance).toBe(7000);
    expect(result.pendingBalance).toBe(500);
    expect(mockWalletRepo.save).not.toHaveBeenCalled();
  });

  it('should create wallet if none exists', async () => {
    mockWalletRepo.findByOwnerId.mockResolvedValue(null);

    const result = await useCase.execute(TENANT_ID, OWNER_ID);

    expect(result.balance).toBe(0);
    expect(mockWalletRepo.save).toHaveBeenCalledTimes(1);
  });
});
