import { ConfirmPaymentUseCase } from '../lib/use-cases/payment/confirm-payment.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Payment } from '@afri-market/marketplace-domain';

describe('ConfirmPaymentUseCase', () => {
  let useCase: ConfirmPaymentUseCase;
  let mockPaymentRepo: Record<string, jest.Mock>;
  let mockOrderRepo: Record<string, jest.Mock>;
  let mockGateway: { notifyPaymentConfirmed: jest.Mock };
  let mockEventDispatcher: { dispatchPaymentConfirmed: jest.Mock };

  const createPendingPayment = (status = 'PENDING') =>
    Payment.reconstitute({
      id: EntityId.from('payment-123'),
      tenantId: TenantId.create('test-tenant'),
      orderId: EntityId.from('order-123'),
      customerId: EntityId.from('customer-789'),
      vendorId: EntityId.from('vendor-456'),
      amount: Money.create(10000),
      method: 'mpesa',
      status: status as never,
      systemCommission: Money.create(1000),
      vendorNet: Money.create(9000),
      driverNet: Money.create(0),
      transactionRef: 'ws_CO_123',
      version: 1,
    });

  beforeEach(() => {
    jest.clearAllMocks();

    mockPaymentRepo = {
      findByTransactionRef: jest.fn(),
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      transitionStatus: jest.fn().mockResolvedValue(true),
    };
    mockOrderRepo = {
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockGateway = { notifyPaymentConfirmed: jest.fn() };
    mockEventDispatcher = { dispatchPaymentConfirmed: jest.fn() };

    useCase = new ConfirmPaymentUseCase(
      mockPaymentRepo as never,
      mockOrderRepo as never,
      mockGateway,
      mockEventDispatcher,
    );
  });

  it('returns NOT_FOUND when no payment matches the transaction ref', async () => {
    mockPaymentRepo.findByTransactionRef.mockResolvedValue(null);

    const result = await useCase.execute({ transactionRef: 'missing-ref' });

    expect(result.status).toBe('NOT_FOUND');
    expect(mockPaymentRepo.transitionStatus).not.toHaveBeenCalled();
    expect(mockGateway.notifyPaymentConfirmed).not.toHaveBeenCalled();
  });

  it('short-circuits without claiming when the payment is not PENDING', async () => {
    mockPaymentRepo.findByTransactionRef.mockResolvedValue(createPendingPayment('ESCROW_HELD'));

    const result = await useCase.execute({ transactionRef: 'ws_CO_123' });

    expect(result.status).toBe('ESCROW_HELD');
    expect(result.message).toContain('already');
    expect(mockPaymentRepo.transitionStatus).not.toHaveBeenCalled();
    expect(mockGateway.notifyPaymentConfirmed).not.toHaveBeenCalled();
    expect(mockEventDispatcher.dispatchPaymentConfirmed).not.toHaveBeenCalled();
  });

  it('claims atomically and fires side effects exactly once', async () => {
    const payment = createPendingPayment();
    mockPaymentRepo.findByTransactionRef.mockResolvedValue(payment);

    const result = await useCase.execute({ transactionRef: 'ws_CO_123', receiptNumber: 'QGH7YZM1' });

    expect(result.status).toBe('ESCROW_HELD');
    expect(mockPaymentRepo.transitionStatus).toHaveBeenCalledTimes(1);
    expect(mockPaymentRepo.transitionStatus).toHaveBeenCalledWith(
      'payment-123',
      'PENDING',
      'ESCROW_HELD',
      expect.objectContaining({ receiptNumber: 'QGH7YZM1' }),
    );
    expect(mockPaymentRepo.save).not.toHaveBeenCalled();
    expect(mockGateway.notifyPaymentConfirmed).toHaveBeenCalledTimes(1);
    expect(mockEventDispatcher.dispatchPaymentConfirmed).toHaveBeenCalledTimes(1);
    expect(mockEventDispatcher.dispatchPaymentConfirmed.mock.calls[0][0]).toMatchObject({
      receiptNumber: 'QGH7YZM1',
      amount: 10000,
    });
  });

  it('loses the race gracefully: reports current status with zero side effects', async () => {
    mockPaymentRepo.findByTransactionRef.mockResolvedValue(createPendingPayment());
    // Concurrent webhook won the claim; re-read shows the post-claim state.
    mockPaymentRepo.transitionStatus.mockResolvedValue(false);
    mockPaymentRepo.findById.mockResolvedValue(createPendingPayment('ESCROW_HELD'));

    const result = await useCase.execute({ transactionRef: 'ws_CO_123' });

    expect(result.status).toBe('ESCROW_HELD');
    expect(result.message).toContain('already');
    expect(mockGateway.notifyPaymentConfirmed).not.toHaveBeenCalled();
    expect(mockEventDispatcher.dispatchPaymentConfirmed).not.toHaveBeenCalled();
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });
});
