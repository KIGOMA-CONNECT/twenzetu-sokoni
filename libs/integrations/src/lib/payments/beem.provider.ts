import { randomUUID } from 'crypto';
import { AppLoggerService } from '@afri-market/core-logger';
import { httpRequest } from './http';
import {
  CardCheckoutParams,
  CardCheckoutResult,
  DisbursePaymentParams,
  IPaymentProvider,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentStatusResponse,
  ReversePaymentResult,
} from './types';

const BEEM_CHECKOUT_URL =
  process.env.BEEM_CHECKOUT_URL || 'https://checkout.beem.africa/v1/checkout';
const BEEM_BALANCE_URL =
  process.env.BEEM_BALANCE_URL || 'https://apitopup.beem.africa/v1/credit-balance';

interface BeemCheckoutResponse {
  src?: string;
  code?: string;
  message?: string;
}

interface BeemBalanceResponse {
  balance_infos?: Array<{
    app_name?: string;
    balance?: number | string;
  }>;
  message?: string;
}

export interface BeemBalanceResult {
  success: boolean;
  balance?: number;
  appName?: string;
  message?: string;
  raw?: unknown;
}

export class BeemPaymentProvider implements IPaymentProvider {
  readonly name = 'beem';

  private readonly apiKey: string;
  private readonly secretKey: string;

  constructor(private readonly logger: AppLoggerService) {
    this.apiKey = process.env.BEEM_PAYMENT_API_KEY || '';
    this.secretKey = process.env.BEEM_PAYMENT_SECRET_KEY || '';
  }

  get isConfigured(): boolean {
    return !!(this.apiKey && this.secretKey);
  }

  private get authHeader(): string {
    return `Basic ${Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64')}`;
  }

  private async createCheckout(params: {
    amount: number;
    accountReference: string;
    mobile?: string;
  }): Promise<{ success: boolean; checkoutUrl?: string; reference: string; message?: string; raw?: unknown }> {
    const transactionId = randomUUID();
    const url = new URL(BEEM_CHECKOUT_URL);
    url.searchParams.set('amount', String(params.amount));
    url.searchParams.set('transaction_id', transactionId);
    url.searchParams.set('reference_number', params.accountReference);
    if (params.mobile) {
      url.searchParams.set('mobile', params.mobile);
    }
    url.searchParams.set('sendSource', 'true');

    const response = await httpRequest<BeemCheckoutResponse>({
      method: 'GET',
      url: url.toString(),
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response?.src) {
      throw new Error(response?.message || 'Beem checkout response missing redirect URL');
    }
    return {
      success: true,
      checkoutUrl: response.src,
      reference: transactionId,
      message: response.message,
      raw: response,
    };
  }

  public async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    const provider = 'beem';

    if (!this.isConfigured) {
      const message = 'Beem payments are not configured. Failing closed instead of simulating a checkout.';
      this.logger.error(message, 'BeemPaymentProvider');
      return { reference: params.accountReference, success: false, status: 'FAILED', provider, message };
    }

    try {
      const result = await this.createCheckout({
        amount: params.amount,
        accountReference: params.accountReference,
        mobile: params.phoneNumber,
      });
      this.logger.log(
        `Beem checkout initiated: ${result.reference} (${params.amount} ${params.currency ?? 'TZS'})`,
        'BeemPaymentProvider',
      );
      return {
        reference: result.reference,
        success: true,
        status: 'INITIATED',
        provider,
        message: result.message,
        raw: result.raw,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Beem checkout failed: ${message}`, 'BeemPaymentProvider');
      return { reference: params.accountReference, success: false, status: 'FAILED', provider, message };
    }
  }

  public async initiateCardCheckout(params: CardCheckoutParams): Promise<CardCheckoutResult> {
    if (!this.isConfigured) {
      const message = 'Beem payments are not configured. Failing closed instead of simulating a card checkout.';
      this.logger.error(message, 'BeemPaymentProvider');
      return { success: false, message };
    }

    try {
      const result = await this.createCheckout({
        amount: params.amount,
        accountReference: params.accountReference,
      });
      this.logger.log(
        `Beem hosted checkout initiated: ${result.reference} (${params.amount} ${params.currency ?? 'TZS'})`,
        'BeemPaymentProvider',
      );
      return {
        success: true,
        checkoutUrl: result.checkoutUrl,
        reference: result.reference,
        message: result.message,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Beem hosted checkout failed: ${message}`, 'BeemPaymentProvider');
      return { success: false, message };
    }
  }

  public async checkPaymentStatus(reference: string): Promise<PaymentStatusResponse> {
    this.logger.log(`Beem status poll for ${reference} (callback-driven)`, 'BeemPaymentProvider');
    return { status: 'PENDING' };
  }

  public async reversePayment(transactionId: string, amount: number, reason: string): Promise<ReversePaymentResult> {
    this.logger.error(
      `Beem reversal requested for ${transactionId} (${amount}, ${reason}) but the disbursement/reversal API is not implemented`,
      'BeemPaymentProvider',
    );
    return { success: false, message: 'Beem payment reversal is not implemented' };
  }

  public async disburse(params: DisbursePaymentParams): Promise<ReversePaymentResult> {
    this.logger.error(
      `Beem disbursement requested for ${params.phoneNumber} (${params.amount}) but the disbursement API is not implemented`,
      'BeemPaymentProvider',
    );
    return { success: false, message: 'Beem disbursement is not implemented' };
  }

  public async getBalance(appName = 'BPAY'): Promise<BeemBalanceResult> {
    if (!this.isConfigured) {
      const message = 'Beem payments are not configured. Failing closed.';
      this.logger.error(message, 'BeemPaymentProvider');
      return { success: false, message };
    }

    try {
      const url = new URL(BEEM_BALANCE_URL);
      url.searchParams.set('app_name', appName);
      const response = await httpRequest<BeemBalanceResponse>({
        method: 'GET',
        url: url.toString(),
        headers: { Authorization: this.authHeader },
      });
      const info = response?.balance_infos?.[0];
      const balance =
        typeof info?.balance === 'number' ? info.balance : Number(info?.balance ?? NaN);
      this.logger.log(`Beem balance for ${appName}: ${balance}`, 'BeemPaymentProvider');
      return {
        success: !Number.isNaN(balance),
        balance: Number.isNaN(balance) ? undefined : balance,
        appName: info?.app_name ?? appName,
        message: response?.message,
        raw: response,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Beem balance check failed: ${message}`, 'BeemPaymentProvider');
      return { success: false, message };
    }
  }
}