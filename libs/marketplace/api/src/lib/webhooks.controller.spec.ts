import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';
import { ConfirmPaymentUseCase } from '@afri-market/marketplace-application';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let confirmPayment: jest.Mocked<ConfirmPaymentUseCase>;

  beforeEach(async () => {
    jest.clearAllMocks();
    confirmPayment = {
      execute: jest.fn().mockResolvedValue({ paymentId: 'pay-1', status: 'CONFIRMED', message: 'Payment confirmed and vendor wallet credited' }),
    } as unknown as jest.Mocked<ConfirmPaymentUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        { provide: ConfirmPaymentUseCase, useValue: confirmPayment },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleMpesaCallback', () => {
    it('should return success response shape', async () => {
      const result = await controller.handleMpesaCallback({
        CheckoutRequestID: 'ext-1',
        ResultCode: 0,
        ResultDesc: 'Success',
        MpesaReceiptNumber: 'receipt-1',
      });
      expect(result).toEqual({ ResultCode: 0, ResultDesc: 'Success' });
    });

    it('should call confirmPayment.execute when ResultCode=0', async () => {
      await controller.handleMpesaCallback({
        ResultCode: 0,
        CheckoutRequestID: 'ext-1',
        MpesaReceiptNumber: 'receipt-1',
      });

      expect(confirmPayment.execute).toHaveBeenCalledWith({
        transactionRef: 'ext-1',
        receiptNumber: 'receipt-1',
      });
    });

    it('should not call confirmPayment.execute when ResultCode is not 0', async () => {
      await controller.handleMpesaCallback({
        ResultCode: 1,
        CheckoutRequestID: 'ext-1',
      });

      expect(confirmPayment.execute).not.toHaveBeenCalled();
    });

    it('should still return success when payment not found', async () => {
      confirmPayment.execute.mockResolvedValue({ paymentId: '', status: 'NOT_FOUND', message: 'Payment not found for transaction ref' });

      const result = await controller.handleMpesaCallback({
        ResultCode: 0,
        ResultDesc: 'Success',
        CheckoutRequestID: 'nonexistent',
      });
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
