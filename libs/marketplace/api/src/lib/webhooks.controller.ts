import { Controller, Post, Body, Headers, Logger, HttpCode, BadRequestException, UnauthorizedException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeController } from '@nestjs/swagger';
import { ConfirmPaymentUseCase, FailPaymentUseCase, CreditWalletUseCase, FindVendorsUseCase } from '@afri-market/marketplace-application';
import { MobileMoneyService } from '@afri-market/integrations';

@ApiTags('Webhooks')
@ApiExcludeController()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly confirmPayment: ConfirmPaymentUseCase,
    private readonly failPayment: FailPaymentUseCase,
    private readonly creditWallet: CreditWalletUseCase,
    private readonly mobileMoney: MobileMoneyService,
    private readonly findVendors: FindVendorsUseCase,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  private async resolveWalletOwner(userId: string): Promise<string> {
    const vendor = await this.findVendors.findByUserId(userId);
    if (vendor) return vendor.id.value;
    return userId;
  }

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
      await this.failTopUpOrPayment(checkoutRequestId, String(stkCallback.ResultDesc));
      return { ResultCode: 0, ResultDesc: 'Processed failure' };
    }

    const queryResult = await this.mobileMoney.checkPaymentStatus(checkoutRequestId, 'mpesa');
    if (queryResult.status !== 'SUCCESS') {
      this.logger.warn(`M-Pesa query status mismatch for ${checkoutRequestId}: ${queryResult.status}`);
      await this.failTopUpOrPayment(checkoutRequestId, `Status query returned ${queryResult.status}`);
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

    const receipt = receiptNumber || queryResult.receiptNumber || '';
    const topup = await this.ds.query(`SELECT * FROM wallet_topup_requests WHERE checkout_request_id = $1 AND status = 'PENDING'`, [checkoutRequestId]);
    if (topup.length > 0) {
      const req = topup[0];
      await this.ds.query(
        `UPDATE wallet_topup_requests SET status = 'COMPLETED', receipt_number = $1, updated_at = NOW() WHERE checkout_request_id = $2`,
        [receipt, checkoutRequestId],
      );
      await this.creditWallet.execute(
        req.tenant_id, await this.resolveWalletOwner(req.user_id), Number(req.amount),
        `M-Pesa top-up: ${receipt}`,
        receipt, 'mpesa_topup',
      );
      this.logger.log(`Wallet top-up completed: user=${req.user_id} amount=${req.amount}`);
    } else {
      await this.confirmPayment.execute({
        transactionRef: checkoutRequestId,
        receiptNumber: receipt,
      });
    }

    return { ResultCode: 0, ResultDesc: 'Success' };
  }

  @Post('azampay')
  @HttpCode(200)
  @ApiOperation({ summary: 'AzamPay payment callback (Tigo Pesa, Airtel Money, HaloPesa, AzamPesa, M-Pesa)' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async handleAzamPayCallback(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: Record<string, unknown>,
  ) {
    this.logger.log(`AzamPay callback received: ${JSON.stringify(body).substring(0, 300)}...`);

    if (!this.mobileMoney.verifyCallback('azampay', headers, body)) {
      this.logger.warn('AzamPay callback signature mismatch - ignoring');
      return { success: false, message: 'Invalid signature' };
    }

    const transactionId = String(body.transactionid ?? body.referenceId ?? body.externalId ?? '');
    const status = String(body.status ?? '').toUpperCase();
    const receipt = String(body.utilityref ?? body.transactionid ?? '');

    if (!transactionId) {
      this.logger.warn('AzamPay callback missing transaction id');
      return { success: false, message: 'Missing transaction id' };
    }

    if (status === 'SUCCESS') {
      const topup = await this.ds.query(
        `SELECT * FROM wallet_topup_requests WHERE checkout_request_id = $1 AND status = 'PENDING'`,
        [transactionId],
      );
      if (topup.length > 0) {
        const req = topup[0];
        await this.ds.query(
          `UPDATE wallet_topup_requests SET status = 'COMPLETED', receipt_number = $1, updated_at = NOW() WHERE checkout_request_id = $2`,
          [receipt, transactionId],
        );
        await this.creditWallet.execute(
          req.tenant_id, await this.resolveWalletOwner(req.user_id), Number(req.amount),
          `${String(body.provider ?? 'AzamPay')} top-up: ${receipt}`,
          receipt || transactionId, 'momo_topup',
        );
        this.logger.log(`Wallet top-up completed via AzamPay: user=${req.user_id} amount=${req.amount}`);
      } else {
        await this.confirmPayment.execute({
          transactionRef: transactionId,
          receiptNumber: receipt || undefined,
        });
      }
    } else {
      this.logger.warn(`AzamPay callback non-success status: ${status}`);
      await this.failTopUpOrPayment(transactionId, `AzamPay status: ${status}`);
    }

    return { success: true, message: 'Success' };
  }

  @Post('internal/topup-confirm')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirm a pending wallet top-up (card/bank/manual) using a shared secret' })
  @ApiResponse({ status: 200, description: 'Top-up completed' })
  @ApiResponse({ status: 401, description: 'Invalid secret' })
  @ApiResponse({ status: 404, description: 'No pending top-up found' })
  async handleInternalTopupConfirm(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: { checkoutRequestId?: string; receiptNumber?: string },
  ) {
    const secret = process.env.PAYMENT_CONFIRM_SECRET || process.env.WEBHOOK_INTERNAL_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException('Webhook secret is not configured');
    }
    const headerValue = headers['x-webhook-secret'] ?? headers['X-Webhook-Secret'];
    const provided = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (provided !== secret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    const checkoutRequestId = body.checkoutRequestId;
    if (!checkoutRequestId) {
      throw new BadRequestException('checkoutRequestId is required');
    }

    const topup = await this.ds.query(
      `SELECT * FROM wallet_topup_requests WHERE checkout_request_id = $1 AND status = 'PENDING'`,
      [checkoutRequestId],
    );
    if (topup.length === 0) {
      throw new NotFoundException('No pending top-up found');
    }

    const req = topup[0];
    const receipt = body.receiptNumber || checkoutRequestId;
    await this.ds.query(
      `UPDATE wallet_topup_requests SET status = 'COMPLETED', receipt_number = $1, updated_at = NOW() WHERE checkout_request_id = $2`,
      [receipt, checkoutRequestId],
    );
    await this.creditWallet.execute(
      req.tenant_id, await this.resolveWalletOwner(req.user_id), Number(req.amount),
      `${String(req.provider ?? 'manual')} top-up: ${receipt}`,
      receipt, `${req.provider ?? 'manual'}_topup`,
    );
    this.logger.log(`Wallet top-up completed manually: user=${req.user_id} amount=${req.amount}`);

    return { success: true, checkoutRequestId };
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

  private async failTopUpOrPayment(reference: string, reason: string): Promise<void> {
    const topup = await this.ds.query(
      `SELECT * FROM wallet_topup_requests WHERE checkout_request_id = $1`,
      [reference],
    );
    if (topup.length > 0) {
      await this.ds.query(
        `UPDATE wallet_topup_requests SET status = 'FAILED', updated_at = NOW() WHERE checkout_request_id = $1`,
        [reference],
      );
    } else {
      await this.failPayment.execute({ transactionRef: reference, reason });
    }
  }
}
