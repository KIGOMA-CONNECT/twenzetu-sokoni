import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeController } from '@nestjs/swagger';
import { ConfirmPaymentUseCase } from '@afri-market/marketplace-application';

@ApiTags('Webhooks')
@ApiExcludeController()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly confirmPayment: ConfirmPaymentUseCase,
  ) {}

  @Post('mpesa')
  @HttpCode(200)
  @ApiOperation({ summary: 'M-Pesa payment callback' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async handleMpesaCallback(@Body() body: Record<string, unknown>) {
    this.logger.log(`M-Pesa callback: ${JSON.stringify(body)}`);

    const checkoutRequestId = body.CheckoutRequestID as string;
    const resultCode = body.ResultCode as number;

    if (checkoutRequestId && resultCode === 0) {
      await this.confirmPayment.execute({
        transactionRef: checkoutRequestId,
        receiptNumber: body.MpesaReceiptNumber as string,
      });
    }

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
    }

    return { status: 'SUCCESS' };
  }
}
