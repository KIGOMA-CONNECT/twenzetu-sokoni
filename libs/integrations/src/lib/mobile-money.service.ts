import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';
import { AzamPayProvider } from './payments/azampay.provider';
import { MpesaProvider } from './payments/mpesa.provider';
import { SandboxPaymentProvider } from './payments/sandbox.provider';
import {
  CardCheckoutParams,
  CardCheckoutResult,
  IPaymentProvider,
  isAzamPayRoutable,
  normalizeProvider,
  PaymentInitiationParams,
  PaymentStatusResponse,
} from './payments/types';

export interface InitiateStkPushParams {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  description: string;
  tenantId?: string;
  provider?:
    | 'mpesa'
    | 'mixx_by_yas'
    | 'tigo_money'
    | 'tigo_pesa'
    | 'airtel_money'
    | 'halotel'
    | 'azampesa';
  currency?: string;
  callbackUrl?: string;
}

export type { PaymentStatusResponse };

export interface StkPushResult {
  checkoutRequestId: string;
  responseCode: string;
  responseDescription?: string;
  merchantRequestID?: string;
}

export interface DisburseParams {
  phoneNumber: string;
  amount: number;
  reference: string;
  description?: string;
  currency?: string;
  provider?:
    | 'mpesa'
    | 'mixx_by_yas'
    | 'tigo_money'
    | 'tigo_pesa'
    | 'airtel_money'
    | 'halotel'
    | 'azampesa';
}

export interface DisburseResult {
  success: boolean;
  message?: string;
  reference?: string;
}

export interface IMobileMoneyService {
  initiateStkPush(params: InitiateStkPushParams): Promise<StkPushResult>;
  initiateCardCheckout(params: CardCheckoutParams): Promise<CardCheckoutResult>;
  checkPaymentStatus(checkoutRequestId: string, provider?: string): Promise<PaymentStatusResponse>;
  reversePayment(transactionId: string, amount: number, reason: string): Promise<{ success: boolean }>;
  disburse(params: DisburseParams): Promise<DisburseResult>;
  verifyCallback(
    provider: string,
    headers: Record<string, string | string[] | undefined>,
    body?: Record<string, unknown>,
  ): boolean;
}

@Injectable()
export class MobileMoneyService implements IMobileMoneyService {
  private readonly azamPay: AzamPayProvider;
  private readonly mpesa: MpesaProvider;
  private readonly sandbox: SandboxPaymentProvider;

  constructor(private readonly logger: AppLoggerService) {
    this.azamPay = new AzamPayProvider(logger);
    this.mpesa = new MpesaProvider(logger);
    this.sandbox = new SandboxPaymentProvider(logger);
  }

  private selectProvider(provider?: string): { impl: IPaymentProvider; normalized: string } {
    const normalized = normalizeProvider(provider);

    if (isAzamPayRoutable(normalized) && this.azamPay.isConfigured) {
      return { impl: this.azamPay, normalized };
    }

    if (normalized === 'mpesa' && this.mpesa.isConfigured) {
      return { impl: this.mpesa, normalized };
    }

    const demoMode = process.env.PAYMENTS_DEMO_MODE === 'true';
    if (this.isProduction() && !demoMode) {
      throw new ServiceUnavailableException(
        `Payment provider ${normalized} is not configured for production`,
      );
    }

    return { impl: this.sandbox, normalized };
  }

  private isProduction(): boolean {
    return process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';
  }

  public async initiateStkPush(params: InitiateStkPushParams): Promise<StkPushResult> {
    const { impl, normalized } = this.selectProvider(params.provider);

    this.logger.log(
      `Initiating ${impl.name} payment for ${params.phoneNumber} (provider=${params.provider ?? 'mpesa'})`,
      'MobileMoneyService',
    );

    const initiationParams: PaymentInitiationParams = {
      ...params,
      provider: normalized,
    };

    const result = await impl.initiatePayment(initiationParams);

    return {
      checkoutRequestId: result.reference,
      responseCode: result.success ? '0' : '1',
      responseDescription: result.message,
      merchantRequestID: result.reference,
    };
  }

  public async initiateCardCheckout(params: CardCheckoutParams): Promise<CardCheckoutResult> {
    if (this.azamPay.isConfigured) {
      return this.azamPay.initiateCardCheckout(params);
    }

    const demoMode = process.env.PAYMENTS_DEMO_MODE === 'true';
    if (this.isProduction() && !demoMode) {
      throw new ServiceUnavailableException(
        'Payment provider is not configured for production',
      );
    }

    this.logger.warn(
      `Card checkout simulated (sandbox) for ${params.accountReference}`,
      'MobileMoneyService',
    );
    return {
      success: true,
      checkoutUrl: `https://payments.local/sandbox/card?externalId=${encodeURIComponent(params.accountReference)}`,
      reference: params.accountReference,
      message: 'Sandbox mode - simulated card checkout URL',
    };
  }

  public async checkPaymentStatus(checkoutRequestId: string, provider?: string): Promise<PaymentStatusResponse> {
    const { impl } = this.selectProvider(provider);
    return impl.checkPaymentStatus(checkoutRequestId);
  }

  public async reversePayment(
    transactionId: string,
    amount: number,
    reason: string,
    provider?: string,
  ): Promise<{ success: boolean }> {
    const { impl } = this.selectProvider(provider);
    return impl.reversePayment(transactionId, amount, reason);
  }

  public async disburse(params: DisburseParams): Promise<DisburseResult> {
    const { impl, normalized } = this.selectProvider(params.provider);

    this.logger.log(
      `Initiating ${impl.name} disbursement for ${params.phoneNumber} (provider=${params.provider ?? 'mpesa'})`,
      'MobileMoneyService',
    );

    const result = await impl.disburse({
      ...params,
      provider: normalized,
    });

    return {
      success: result.success,
      message: result.message,
      reference: params.reference,
    };
  }

  public verifyCallback(
    provider: string,
    headers: Record<string, string | string[] | undefined>,
    body?: Record<string, unknown>,
  ): boolean {
    const gateway = (provider || '').toLowerCase().trim();
    if (gateway === 'mpesa') {
      return true;
    }
    return this.azamPay.verifyCallback(headers, body);
  }
}
