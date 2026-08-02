import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { ConfirmPaymentUseCase, FailPaymentUseCase, CreditWalletUseCase } from '@afri-market/marketplace-application';
import { MobileMoneyService } from '@afri-market/integrations';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let confirmPayment: jest.Mocked<ConfirmPaymentUseCase>;

  beforeEach(async () => {
    jest.clearAllMocks();
    confirmPayment = {
      execute: jest.fn().mockResolvedValue({ paymentId: 'pay-1', status: 'CONFIRMED', message: 'Payment confirmed and vendor wallet credited' }),
    } as unknown as jest.Mocked<ConfirmPaymentUseCase>;

    const failPayment = {
      execute: jest.fn().mockResolvedValue({ paymentId: '', status: 'FAILED' }),
    } as unknown as jest.Mocked<FailPaymentUseCase>;

    const creditWallet = {
      execute: jest.fn().mockResolvedValue({ walletId: 'wallet-1', balance: 1000 }),
    } as unknown as jest.Mocked<CreditWalletUseCase>;

    const mobileMoney = {
      checkPaymentStatus: jest.fn().mockResolvedValue({ status: 'SUCCESS', receiptNumber: 'receipt-1' }),
    } as unknown as jest.Mocked<MobileMoneyService>;

    const dataSource = {
      query: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        { provide: ConfirmPaymentUseCase, useValue: confirmPayment },
        { provide: FailPaymentUseCase, useValue: failPayment },
        { provide: CreditWalletUseCase, useValue: creditWallet },
        { provide: MobileMoneyService, useValue: mobileMoney },
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
});
