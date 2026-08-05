import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { ConfirmPaymentUseCase, FailPaymentUseCase, CreditWalletUseCase, FindVendorsUseCase } from '@afri-market/marketplace-application';
import { MobileMoneyService } from '@afri-market/integrations';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let confirmPayment: jest.Mocked<ConfirmPaymentUseCase>;
  let creditWallet: jest.Mocked<CreditWalletUseCase>;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    confirmPayment = {
      execute: jest.fn().mockResolvedValue({ paymentId: 'pay-1', status: 'CONFIRMED', message: 'Payment confirmed and vendor wallet credited' }),
    } as unknown as jest.Mocked<ConfirmPaymentUseCase>;

    const failPayment = {
      execute: jest.fn().mockResolvedValue({ paymentId: '', status: 'FAILED' }),
    } as unknown as jest.Mocked<FailPaymentUseCase>;

    creditWallet = {
      execute: jest.fn().mockResolvedValue({ walletId: 'wallet-1', balance: 1000 }),
    } as unknown as jest.Mocked<CreditWalletUseCase>;

    const mobileMoney = {
      checkPaymentStatus: jest.fn().mockResolvedValue({ status: 'SUCCESS', receiptNumber: 'receipt-1' }),
      verifyCallback: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<MobileMoneyService>;

    const findVendors = {
      findByUserId: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<FindVendorsUseCase>;

    dataSource = {
      query: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        { provide: ConfirmPaymentUseCase, useValue: confirmPayment },
        { provide: FailPaymentUseCase, useValue: failPayment },
        { provide: CreditWalletUseCase, useValue: creditWallet },
        { provide: MobileMoneyService, useValue: mobileMoney },
        { provide: FindVendorsUseCase, useValue: findVendors },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleMpesaCallback', () => {
    const stk = (overrides: Record<string, unknown>) => ({
      Body: {
        stkCallback: {
          MerchantRequestID: 'mr-1',
          CheckoutRequestID: 'ext-1',
          ResultCode: 0,
          ResultDesc: 'Success',
          CallbackMetadata: {
            Item: [
              { Name: 'MpesaReceiptNumber', Value: 'receipt-1' },
            ],
          },
          ...overrides,
        },
      },
    });

    it('should return success response shape', async () => {
      const result = await controller.handleMpesaCallback(stk({}));
      expect(result).toEqual({ ResultCode: 0, ResultDesc: 'Success' });
    });

    it('should call confirmPayment.execute when ResultCode=0', async () => {
      await controller.handleMpesaCallback(stk({}));

      expect(confirmPayment.execute).toHaveBeenCalledWith({
        transactionRef: 'ext-1',
        receiptNumber: 'receipt-1',
      });
    });

    it('should not call confirmPayment.execute when ResultCode is not 0', async () => {
      await controller.handleMpesaCallback(stk({ ResultCode: 1, ResultDesc: 'Failed' }));

      expect(confirmPayment.execute).not.toHaveBeenCalled();
    });

    it('should still return success when payment not found', async () => {
      confirmPayment.execute.mockResolvedValue({ paymentId: '', status: 'NOT_FOUND', message: 'Payment not found for transaction ref' });

      const result = await controller.handleMpesaCallback(stk({ CheckoutRequestID: 'nonexistent' }));
      expect(result).toEqual({ ResultCode: 0, ResultDesc: 'Success' });
    });
  });

  describe('handleMtnMomoCallback', () => {
    it('should return success response shape', async () => {
      const result = await controller.handleMtnMomoCallback({
        externalId: 'ext-1',
        status: 'SUCCESSFUL',
        financialTransactionId: 'txn-123',
      });
      expect(result).toEqual({ status: 'SUCCESS' });
    });

    it('should call confirmPayment.execute when status is SUCCESSFUL', async () => {
      await controller.handleMtnMomoCallback({
        externalId: 'ext-1',
        status: 'SUCCESSFUL',
        financialTransactionId: 'txn-123',
      });

      expect(confirmPayment.execute).toHaveBeenCalledWith({
        transactionRef: 'ext-1',
        receiptNumber: 'txn-123',
      });
    });

    it('should not call confirmPayment.execute when status is not SUCCESSFUL', async () => {
      await controller.handleMtnMomoCallback({
        externalId: 'ext-1',
        status: 'FAILED',
      });

      expect(confirmPayment.execute).not.toHaveBeenCalled();
    });
  });

  describe('handleTigoPesaCallback', () => {
    it('should return success response shape', async () => {
      const result = await controller.handleTigoPesaCallback({
        TransactionID: 'tigo-456',
        ConversationMetadata: { CallbackReason: 'Success' },
      });
      expect(result).toEqual({ status: 'SUCCESS' });
    });

    it('should call confirmPayment.execute when CallbackReason is Success', async () => {
      await controller.handleTigoPesaCallback({
        TransactionID: 'tigo-456',
        ConversationMetadata: { CallbackReason: 'Success' },
      });

      expect(confirmPayment.execute).toHaveBeenCalledWith({
        transactionRef: 'tigo-456',
      });
    });

    it('should not call confirmPayment.execute when CallbackReason is not Success', async () => {
      await controller.handleTigoPesaCallback({
        TransactionID: 'tigo-456',
        ConversationMetadata: { CallbackReason: 'Failed' },
      });

      expect(confirmPayment.execute).not.toHaveBeenCalled();
    });
  });

  describe('handleAzamPayCallback', () => {
    it('should return success response shape', async () => {
      const result = await controller.handleAzamPayCallback(
        {},
        { transactionid: 'azp-1', status: 'SUCCESS', externalId: 'order-1' },
      );
      expect(result).toEqual({ success: true, message: 'Success' });
    });

    it('should call confirmPayment.execute for an order payment when status is SUCCESS', async () => {
      await controller.handleAzamPayCallback(
        {},
        {
          transactionid: 'azp-1',
          status: 'SUCCESS',
          externalId: 'order-1',
          utilityref: 'receipt-azp',
          provider: 'TigoPesa',
        },
      );

      expect(confirmPayment.execute).toHaveBeenCalledWith({
        transactionRef: 'azp-1',
        receiptNumber: 'receipt-azp',
      });
    });

    it('should complete a wallet top-up when it matches the transaction id', async () => {
      dataSource.query.mockResolvedValueOnce([
        { tenant_id: 't1', user_id: 'u1', amount: 5000, provider: 'TigoPesa' },
      ]);

      await controller.handleAzamPayCallback(
        {},
        { transactionid: 'azp-2', status: 'SUCCESS', utilityref: 'receipt-2' },
      );

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE wallet_topup_requests SET status ='),
        ['receipt-2', 'azp-2'],
      );
      expect(creditWallet.execute).toHaveBeenCalledWith('t1', 'u1', 5000, expect.stringContaining('top-up'), 'receipt-2', 'momo_topup');
      expect(confirmPayment.execute).not.toHaveBeenCalled();
    });

    it('should fail the payment when status is not SUCCESS', async () => {
      await controller.handleAzamPayCallback(
        {},
        { transactionid: 'azp-3', status: 'FAILED', externalId: 'order-3' },
      );

      expect(confirmPayment.execute).not.toHaveBeenCalled();
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM wallet_topup_requests'),
        ['azp-3'],
      );
    });
  });

  describe('handleInternalTopupConfirm', () => {
    it('should throw when secret is required but missing', async () => {
      process.env.PAYMENT_CONFIRM_SECRET = 'topsecret';

      await expect(controller.handleInternalTopupConfirm({}, { checkoutRequestId: 'card-1' })).rejects.toThrow();

      delete process.env.PAYMENT_CONFIRM_SECRET;
    });

    it('should reject when the provided secret is wrong', async () => {
      process.env.PAYMENT_CONFIRM_SECRET = 'topsecret';

      await expect(
        controller.handleInternalTopupConfirm({ 'x-webhook-secret': 'wrong' }, { checkoutRequestId: 'card-1' }),
      ).rejects.toThrow();

      delete process.env.PAYMENT_CONFIRM_SECRET;
    });

    it('should complete a pending card/bank top-up and credit the wallet', async () => {
      process.env.PAYMENT_CONFIRM_SECRET = 'topsecret';
      dataSource.query.mockResolvedValueOnce([
        { tenant_id: 't1', user_id: 'u1', amount: 20000, provider: 'card' },
      ]);

      const result = await controller.handleInternalTopupConfirm(
        { 'x-webhook-secret': 'topsecret' },
        { checkoutRequestId: 'card-1', receiptNumber: 'card-receipt-1' },
      );

      expect(result).toEqual({ success: true, checkoutRequestId: 'card-1' });
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE wallet_topup_requests SET status ='),
        ['card-receipt-1', 'card-1'],
      );
      expect(creditWallet.execute).toHaveBeenCalledWith('t1', 'u1', 20000, expect.stringContaining('card'), 'card-receipt-1', 'card_topup');

      delete process.env.PAYMENT_CONFIRM_SECRET;
    });

    it('should throw NotFound when no pending top-up exists', async () => {
      process.env.PAYMENT_CONFIRM_SECRET = 'topsecret';

      await expect(
        controller.handleInternalTopupConfirm(
          { 'x-webhook-secret': 'topsecret' },
          { checkoutRequestId: 'card-2' },
        ),
      ).rejects.toThrow();

      delete process.env.PAYMENT_CONFIRM_SECRET;
    });
  });
});
