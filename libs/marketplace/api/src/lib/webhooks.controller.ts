import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeController } from '@nestjs/swagger';
import { ConfirmPaymentUseCase, FailPaymentUseCase } from '@afri-market/marketplace-application';
import { MobileMoneyService } from '@afri-market/integrations';

@ApiTags('Webhooks')
@ApiExcludeController()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly confirmPayment: ConfirmPaymentUseCase,
    private readonly failPayment: FailPaymentUseCase,
    private readonly mobileMoney: MobileMoneyService,
  ) {}

  @Post('mpesa')
  @HttpCode(200)
  @ApiOperation({ summary: 'M-Pesa payment callback' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async handleMpesaCallback(@Body() body: Record<string, unknown>) {
    this.logger.log(`M-Pesa callback received: ${JSON.stringify(body).substring(0, 200)}...`);

    const bodyRecord = body as Record<string, unknown>;
    const stkCallback = (bodyRecord.Body as Record<string, unknown>)?.stkCallback as Record<string, unknown> | undefined;
    if (!stkCallback) {
      this.logger.warn('Invalid M-Pesa callback: missing stkCallback');
      return { ResultCode: 1, ResultDesc: 'Invalid callback' };
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID as string;
    const resultCode = stkCallback.ResultCode as number;

    if (resultCode !== 0) {
      this.logger.warn(`M-Pesa callback with non-zero result: ${resultCode} - ${stkCallback.ResultDesc}`);
      await this.failPayment.execute({ transactionRef: checkoutRequestId, reason: String(stkCallback.ResultDesc) });
      return { ResultCode: 0, ResultDesc: 'Processed failure' };
    }

    const queryResult = await this.mobileMoney.checkPaymentStatus(checkoutRequestId);
    if (queryResult.status !== 'SUCCESS') {
      this.logger.warn(`M-Pesa query status mismatch for ${checkoutRequestId}: ${queryResult.status}`);
      await this.failPayment.execute({ transactionRef: checkoutRequestId, reason: `Status query returned ${queryResult.status}` });
      return { ResultCode: 0, ResultDesc: 'Processed' };
    }

    const callbackMetadata = (stkCallback as Record<string, unknown>).CallbackMetadata;
    let receiptNumber = '';
    if (callbackMetadata) {
      const items = (callbackMetadata as Record<string, unknown>).Item as Array<Record<string, unknown>> | undefined;
      if (items) {
        const receiptItem = items.find((i: Record<string, unknown>) => i.Name === 'MpesaReceiptNumber');
        if (receiptItem) {
          receiptNumber = String(receiptItem.Value ?? '');
        }
      }
    }

    await this.confirmPayment.execute({
      transactionRef: checkoutRequestId,
      receiptNumber: receiptNumber || queryResult.receiptNumber,
    });

    return { ResultCode: 0, ResultDesc: 'Success' };
  }

  @Post('momo')
  @HttpCode(200)
  @ApiOperation({ summary: 'MTN Mobile Money callback' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async handleMtnMomoCallback(@Body() body: Record<string, unknown>) {
    this.logger.log(`MTN MoMo callback: ${JSON.stringify(body)}`);

    const externalId = body.externalId as string;
    const status = body.status as string;

    if (externalId && status === 'SUCCESSFUL') {
      await this.confirmPayment.execute({
        transactionRef: externalId,
        receiptNumber: body.financialTransactionId as string,
      });
    } else {
      await this.failPayment.execute({ transactionRef: externalId, reason: `MoMo status: ${status}` });
    }

    return { status: 'SUCCESS' };
  }

  @Post('tigo-pesa')
  @HttpCode(200)
  @ApiOperation({ summary: 'Tigo Pesa payment callback' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async handleTigoPesaCallback(@Body() body: Record<string, unknown>) {
    this.logger.log(`Tigo Pesa callback: ${JSON.stringify(body)}`);

    const transactionId = body.TransactionID as string;
    const callbackReason = (body.ConversationMetadata as Record<string, unknown>)?.CallbackReason as string;

    if (transactionId && callbackReason === 'Success') {
      await this.confirmPayment.execute({
        transactionRef: transactionId,
      });
    } else {
      await this.failPayment.execute({ transactionRef: transactionId, reason: `Tigo status: ${callbackReason}` });
    }

    return { status: 'SUCCESS' };
  }
}
