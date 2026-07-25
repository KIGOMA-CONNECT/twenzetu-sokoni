import { ListWalletTransactionsUseCase } from '../lib/use-cases/wallet/list-wallet-transactions.use-case';
import { EntityId, TenantId } from '@afri-market/kernel';
import { WalletTransaction } from '@afri-market/marketplace-domain';

describe('ListWalletTransactionsUseCase', () => {
  let useCase: ListWalletTransactionsUseCase;
  let mockTxRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';
  const OWNER_ID = 'owner-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockTxRepo = { findByOwnerId: jest.fn().mockResolvedValue({ data: [], total: 0 }) };
    useCase = new ListWalletTransactionsUseCase(mockTxRepo);
  });

  it('should return transactions for owner', async () => {
    const tx1 = WalletTransaction.create({
      tenantId: TenantId.create(TENANT_ID),
      walletId: EntityId.from('w1'),
      ownerId: OWNER_ID,
      ownerType: 'vendor',
      type: 'CREDIT',
      amount: 5000,
      balanceAfter: 5000,
      description: 'Top up',
    });
    mockTxRepo.findByOwnerId.mockResolvedValue({ data: [tx1], total: 1 });

    const result = await useCase.execute(TENANT_ID, OWNER_ID);

    expect(mockTxRepo.findByOwnerId).toHaveBeenCalledWith(TENANT_ID, OWNER_ID, {});
    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].type).toBe('CREDIT');
    expect(result.data[0].amount).toBe(5000);
  });

  it('should pass limit and offset to repo', async () => {
    await useCase.execute(TENANT_ID, OWNER_ID, { limit: 10, offset: 20 });

    expect(mockTxRepo.findByOwnerId).toHaveBeenCalledWith(TENANT_ID, OWNER_ID, { limit: 10, offset: 20 });
  });

  it('should return empty results when no transactions', async () => {
    const result = await useCase.execute(TENANT_ID, OWNER_ID);

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});
