import { ReleasePaymentUseCase } from '../lib/use-cases/payment/release-payment.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Payment, Wallet } from '@afri-market/marketplace-domain';

describe('ReleasePaymentUseCase', () => {
  let useCase: ReleasePaymentUseCase;
  let mockPaymentRepo: Record<string, jest.Mock>;
  let mockWalletRepo: Record<string, jest.Mock>;
  let mockTxRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';
  const ORDER_ID = 'order-123';
  const VENDOR_ID = 'vendor-456';

  beforeEach(() => {
    jest.clearAllMocks();

    mockPaymentRepo = {
      findByOrderId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockWalletRepo = {
      findByOwnerId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockTxRepo = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new ReleasePaymentUseCase(mockPaymentRepo, mockWalletRepo, mockTxRepo);
  });

  const createEscrowPayment = () =>
    Payment.reconstitute({
      id: EntityId.from('payment-123'),
      tenantId: TenantId.create(TENANT_ID),
      orderId: EntityId.from(ORDER_ID),
      customerId: EntityId.from('customer-789'),
      vendorId: EntityId.from(VENDOR_ID),
      amount: Money.create(10000),
      method: 'mpesa',
      status: 'ESCROW_HELD',
      systemCommission: Money.create(1000),
      vendorNet: Money.create(9000),
      driverNet: Money.create(0),
      transactionRef: undefined,
      version: 1,
    });

  it('should release escrow and credit vendor wallet', async () => {
    const payment = createEscrowPayment();
    mockPaymentRepo.findByOrderId.mockResolvedValue(payment);
    mockWalletRepo.findByOwnerId.mockResolvedValue(null);

    const result = await useCase.execute(TENANT_ID, ORDER_ID);

    expect(result.paymentId).toBe('payment-123');
    expect(result.status).toBe('RELEASED');
    expect(result.vendorNetCredited).toBe(9000);
    expect(result.commissionRetained).toBe(1000);
    expect(mockPaymentRepo.save).toHaveBeenCalledTimes(1);
    expect(mockWalletRepo.save).toHaveBeenCalledTimes(1);
    expect(mockTxRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should credit existing vendor wallet', async () => {
    const payment = createEscrowPayment();
    const existingWallet = Wallet.reconstitute({
      id: EntityId.from('wallet-1'),
      tenantId: TenantId.create(TENANT_ID),
      ownerId: EntityId.from(VENDOR_ID),
      ownerType: 'vendor',
      balance: Money.create(5000),
      pendingBalance: Money.create(0),
      version: 1,
    });
    mockPaymentRepo.findByOrderId.mockResolvedValue(payment);
    mockWalletRepo.findByOwnerId.mockResolvedValue(existingWallet);

    const result = await useCase.execute(TENANT_ID, ORDER_ID);

    expect(result.vendorNetCredited).toBe(9000);
    expect(mockWalletRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw if payment not found', async () => {
    mockPaymentRepo.findByOrderId.mockResolvedValue(null);

    await expect(useCase.execute(TENANT_ID, ORDER_ID)).rejects.toThrow('No payment found');
    expect(mockPaymentRepo.save).not.toHaveBeenCalled();
  });

  it('should throw if payment not in ESCROW_HELD', async () => {
    const payment = createEscrowPayment();
    payment.release('ref');
    mockPaymentRepo.findByOrderId.mockResolvedValue(payment);

    await expect(useCase.execute(TENANT_ID, ORDER_ID)).rejects.toThrow('not in ESCROW_HELD');
    expect(mockPaymentRepo.save).not.toHaveBeenCalled();
  });
});
