import { Controller, Post, Body, Headers, Logger, HttpCode, BadRequestException, UnauthorizedException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { timingSafeEqual } from 'crypto';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeController } from '@nestjs/swagger';
import { ConfirmPaymentUseCase, FailPaymentUseCase, CreditWalletUseCase, FindVendorsUseCase } from '@afri-market/marketplace-application';
import { MobileMoneyService } from '@afri-market/integrations';
import { InternalTopupConfirmDto } from './dto/internal-topup-confirm.dto';

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
  async handleMpesaCallback(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: Record<string, unknown>,
  ) {
    if (!this.verifyWebhookSecret(headers)) {
      this.logger.warn('M-Pesa callback rejected: invalid webhook secret');
      throw new UnauthorizedException('Invalid webhook secret');
    }
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
    const claimed = await this.claimPendingTopUp(checkoutRequestId, receipt, 'mpesa_topup');
    if (claimed) {
      this.logger.log(`Wallet top-up completed: user=${claimed.user_id} amount=${claimed.amount}`);
      return { ResultCode: 0, ResultDesc: 'Success' };
    }
    if (await this.topUpExists(checkoutRequestId)) {
      this.logger.log(`Top-up ${checkoutRequestId} already processed; skipping duplicate credit`);
      return { ResultCode: 0, ResultDesc: 'Success' };
    }
    await this.confirmPayment.execute({
      transactionRef: checkoutRequestId,
      receiptNumber: receipt,
    });

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
      const claimed = await this.claimPendingTopUp(transactionId, receipt || transactionId, 'momo_topup');
      if (claimed) {
        this.logger.log(`Wallet top-up completed via AzamPay: user=${claimed.user_id} amount=${claimed.amount}`);
        return { success: true, message: 'Success' };
      }
      if (await this.topUpExists(transactionId)) {
        this.logger.log(`Top-up ${transactionId} already processed; skipping duplicate credit`);
        return { success: true, message: 'Success' };
      }
      await this.confirmPayment.execute({
        transactionRef: transactionId,
        receiptNumber: receipt || undefined,
      });
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
    @Body() body: InternalTopupConfirmDto,
  ) {
    const secret = process.env.PAYMENT_CONFIRM_SECRET || process.env.WEBHOOK_INTERNAL_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException('Webhook secret is not configured');
    }
    const headerValue = headers['x-webhook-secret'] ?? headers['X-Webhook-Secret'];
    const provided = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (!provided) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    try {
      const a = Buffer.from(provided);
      const b = Buffer.from(secret);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new UnauthorizedException('Invalid webhook secret');
      }
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Invalid webhook secret');
    }

    const checkoutRequestId = body.checkoutRequestId;
    if (!checkoutRequestId) {
      throw new BadRequestException('checkoutRequestId is required');
    }

    const req = await this.claimPendingTopUp(
      checkoutRequestId,
      body.receiptNumber || checkoutRequestId,
      `${String((await this.ds.query(`SELECT provider FROM wallet_topup_requests WHERE checkout_request_id = $1`, [checkoutRequestId]))?.[0]?.provider ?? 'manual')}_topup`,
    );
    if (!req) {
      throw new NotFoundException('No pending top-up found');
    }

    this.logger.log(`Wallet top-up completed manually: user=${req.user_id} amount=${req.amount}`);

    return { success: true, checkoutRequestId };
  }

  @Post('momo')
  @HttpCode(200)
  @ApiOperation({ summary: 'MTN Mobile Money callback' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async handleMtnMomoCallback(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: Record<string, unknown>,
  ) {
    if (!this.verifyWebhookSecret(headers)) {
      this.logger.warn('MTN MoMo callback rejected: invalid webhook secret');
      throw new UnauthorizedException('Invalid webhook secret');
    }
    this.logger.log(`MTN MoMo callback received: ${JSON.stringify(body).substring(0, 300)}...`);

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
  async handleTigoPesaCallback(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: Record<string, unknown>,
  ) {
    if (!this.verifyWebhookSecret(headers)) {
      this.logger.warn('Tigo Pesa callback rejected: invalid webhook secret');
      throw new UnauthorizedException('Invalid webhook secret');
    }
    this.logger.log(`Tigo Pesa callback received: ${JSON.stringify(body).substring(0, 300)}...`);

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

  private verifyWebhookSecret(headers: Record<string, string | string[] | undefined>): boolean {
    const secret = process.env.PAYMENT_CONFIRM_SECRET || process.env.WEBHOOK_INTERNAL_SECRET;
    if (!secret) {
      this.logger.error('PAYMENT_CONFIRM_SECRET is not configured — webhook verification DISABLED');
      throw new ServiceUnavailableException('Webhook secret not configured');
    }
    const headerValue = headers['x-webhook-secret'] ?? headers['X-Webhook-Secret'];
    const provided = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (!provided) return false;
    try {
      const a = Buffer.from(provided);
      const b = Buffer.from(secret);
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
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

  private async topUpExists(checkoutRequestId: string): Promise<boolean> {
    const rows = await this.ds.query(
      `SELECT 1 FROM wallet_topup_requests WHERE checkout_request_id = $1`,
      [checkoutRequestId],
    );
    return rows.length > 0;
  }

  private async claimPendingTopUp(
    checkoutRequestId: string,
    receipt: string,
    kind: string,
  ): Promise<{ tenant_id: string; user_id: string; amount: number } | null> {
    const claimed = await this.ds.query(
      `UPDATE wallet_topup_requests SET status = 'COMPLETED', receipt_number = $1, updated_at = NOW()
       WHERE checkout_request_id = $2 AND status = 'PENDING'
       RETURNING id, tenant_id, user_id, amount`,
      [receipt, checkoutRequestId],
    );
    if (claimed.length === 0) {
      return null;
    }
    const req = claimed[0];
    await this.creditWallet.execute(
      req.tenant_id, await this.resolveWalletOwner(req.user_id), Number(req.amount),
      `${kind} top-up: ${receipt}`,
      receipt, kind,
    );
    return { tenant_id: req.tenant_id, user_id: req.user_id, amount: Number(req.amount) };
  }
}
