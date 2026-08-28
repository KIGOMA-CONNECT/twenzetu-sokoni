import { timingSafeEqual } from 'crypto';
import { AppLoggerService } from '@afri-market/core-logger';
import { httpRequest } from './http';
import {
  AZAMPAY_PROVIDER_MAP,
  CardCheckoutParams,
  CardCheckoutResult,
  DisbursePaymentParams,
  IPaymentProvider,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentStatusResponse,
  ReversePaymentResult,
} from './types';

interface AzamPayConfig {
  appName: string;
  clientId: string;
  clientSecret: string;
  apiKey: string;
  environment: 'sandbox' | 'production';
  callbackUrl: string;
  cardSuccessUrl: string;
  cardFailUrl: string;
}

interface AzamPayTokenResponse {
  success?: boolean;
  data?: {
    accessToken?: string;
    expire?: string;
  };
}

interface AzamPayMnoResponse {
  success?: boolean;
  transactionId?: string;
  message?: string;
}

export class AzamPayProvider implements IPaymentProvider {
  readonly name = 'azampay';

  private readonly config: AzamPayConfig;
  private token: string | null = null;
  private tokenExpiry = 0;

  constructor(private readonly logger: AppLoggerService) {
    const isProd = process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';
    this.config = {
      appName: process.env.AZAMPAY_APP_NAME || '',
      clientId: process.env.AZAMPAY_CLIENT_ID || '',
      clientSecret: process.env.AZAMPAY_CLIENT_SECRET || '',
      apiKey: process.env.AZAMPAY_API_KEY || '',
      environment: (process.env.AZAMPAY_ENVIRONMENT as 'sandbox' | 'production') || (isProd ? 'production' : 'sandbox'),
      callbackUrl: process.env.AZAMPAY_CALLBACK_URL || '',
      cardSuccessUrl: process.env.AZAMPAY_CARD_SUCCESS_URL || '',
      cardFailUrl: process.env.AZAMPAY_CARD_FAIL_URL || '',
    };
  }

  get isConfigured(): boolean {
    return !!(this.config.appName && this.config.clientId && this.config.clientSecret);
  }

  private get authBaseUrl(): string {
    return this.config.environment === 'production'
      ? 'https://authenticator.azampay.co.tz'
      : 'https://authenticator-sandbox.azampay.co.tz';
  }

  private get checkoutBaseUrl(): string {
    return this.config.environment === 'production'
      ? 'https://checkout.azampay.co.tz'
      : 'https://sandbox.azampay.co.tz';
  }

  public async getAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const response = await httpRequest<AzamPayTokenResponse>({
      method: 'POST',
      url: `${this.authBaseUrl}/AppRegistration/GenerateToken`,
      headers: this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {},
      body: {
        appName: this.config.appName,
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
      },
    });

    const accessToken = response?.data?.accessToken;
    if (!accessToken) {
      throw new Error('AzamPay token response missing accessToken');
    }

    this.token = accessToken;
    this.tokenExpiry = Date.now() + 55 * 60 * 1000;
    return this.token;
  }

  public async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    const provider = AZAMPAY_PROVIDER_MAP[params.provider ?? 'mpesa'] ?? 'M-Pesa';

    if (!this.isConfigured) {
      const message = 'AzamPay is not configured. Failing closed instead of simulating a checkout.';
      this.logger.error(message, 'AzamPayProvider');
      return {
        reference: params.accountReference,
        success: false,
        status: 'FAILED',
        provider,
        message,
      };
    }

    try {
      const token = await this.getAccessToken();
      const response = await httpRequest<AzamPayMnoResponse>({
        method: 'POST',
        url: `${this.checkoutBaseUrl}/azampay/mno/checkout`,
        headers: { Authorization: `Bearer ${token}` },
        body: {
          accountNumber: params.phoneNumber,
          amount: String(params.amount),
          currency: params.currency ?? 'TZS',
          externalId: params.accountReference,
          provider,
          callbackUrl: params.callbackUrl || this.config.callbackUrl,
        },
      });

      const success = response?.success === true;
      if (!success) {
        throw new Error(response?.message || 'AzamPay checkout failed');
      }

      const reference = response?.transactionId || params.accountReference;
      this.logger.log(`AzamPay checkout initiated: ${reference} (${provider})`, 'AzamPayProvider');
      return {
        reference,
        success: true,
        status: 'INITIATED',
        provider,
        message: response?.message,
        raw: response,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`AzamPay MNO checkout failed: ${message}`, 'AzamPayProvider');
      return {
        reference: params.accountReference,
        success: false,
        status: 'FAILED',
        provider,
        message,
      };
    }
  }

  public async initiateCardCheckout(params: CardCheckoutParams): Promise<CardCheckoutResult> {
    if (!this.isConfigured) {
      const message = 'AzamPay is not configured. Failing closed instead of simulating a card checkout.';
      this.logger.error(message, 'AzamPayProvider');
      return { success: false, message };
    }

    if (!this.config.cardSuccessUrl || !this.config.cardFailUrl) {
      const message = 'AZAMPAY_CARD_SUCCESS_URL and AZAMPAY_CARD_FAIL_URL must be configured for card checkout.';
      this.logger.error(message, 'AzamPayProvider');
      return { success: false, message };
    }

    try {
      const token = await this.getAccessToken();
      const response = await httpRequest<{
        success?: boolean;
        checkoutUrl?: string;
        message?: string;
      }>({
        method: 'POST',
        url: `${this.checkoutBaseUrl}/azampay/checkout`,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {}),
        },
        body: {
          amount: String(params.amount),
          currency: params.currency ?? 'TZS',
          externalId: params.accountReference,
          redirectSuccessURL: this.config.cardSuccessUrl,
          redirectFailURL: this.config.cardFailUrl,
          callbackUrl: this.config.callbackUrl,
          cart: {
            items: [
              {
                name: params.description,
                amount: String(params.amount),
                quantity: 1,
              },
            ],
          },
          billing: {
            email: params.customerEmail ?? '',
            firstName: params.customerFirstName ?? '',
            lastName: params.customerLastName ?? '',
          },
        },
      });

      const success = response?.success === true && !!response?.checkoutUrl;
      if (!success) {
        throw new Error(response?.message || 'AzamPay card checkout failed');
      }

      this.logger.log(
        `AzamPay card checkout initiated: ${params.accountReference} (${params.currency ?? 'TZS'})`,
        'AzamPayProvider',
      );
      return {
        success: true,
        checkoutUrl: response.checkoutUrl,
        reference: params.accountReference,
        message: response?.message,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`AzamPay card checkout failed: ${message}`, 'AzamPayProvider');
      return { success: false, message };
    }
  }

  public async checkPaymentStatus(reference: string): Promise<PaymentStatusResponse> {
    this.logger.log(`AzamPay status poll for ${reference} (callback-driven)`, 'AzamPayProvider');
    return { status: 'PENDING' };
  }

  public async reversePayment(transactionId: string, amount: number, reason: string): Promise<ReversePaymentResult> {
    if (!this.isConfigured) {
      const message = 'AzamPay is not configured. Failing closed instead of simulating a reversal.';
      this.logger.error(message, 'AzamPayProvider');
      return { success: false, message };
    }

    try {
      const token = await this.getAccessToken();
      await httpRequest<unknown>({
        method: 'POST',
        url: `${this.checkoutBaseUrl}/azampay/createtransfer`,
        headers: { Authorization: `Bearer ${token}` },
        body: {
          source: { countryCode: 'TZ', fullName: '', bankName: '', accountNumber: '', currency: 'TZS' },
          destination: { countryCode: 'TZ', fullName: '', bankName: '', accountNumber: transactionId, currency: 'TZS' },
          transferDetails: { type: 'Refund', amount: Math.round(amount), date: new Date().toISOString() },
          externalReferenceId: `refund_${transactionId}`,
          remarks: reason,
        },
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`AzamPay reversal failed: ${message}`, 'AzamPayProvider');
      return { success: false, message };
    }
  }

  public async disburse(params: DisbursePaymentParams): Promise<ReversePaymentResult> {
    const provider = AZAMPAY_PROVIDER_MAP[params.provider ?? 'mpesa'] ?? 'M-Pesa';

    if (!this.isConfigured) {
      const message = 'AzamPay is not configured. Failing closed instead of simulating a disbursement.';
      this.logger.error(message, 'AzamPayProvider');
      return { success: false, message };
    }

    try {
      const token = await this.getAccessToken();
      await httpRequest<unknown>({
        method: 'POST',
        url: `${this.checkoutBaseUrl}/azampay/createtransfer`,
        headers: { Authorization: `Bearer ${token}` },
        body: {
          source: { countryCode: 'TZ', fullName: '', bankName: '', accountNumber: '', currency: params.currency ?? 'TZS' },
          destination: { countryCode: 'TZ', fullName: '', bankName: '', accountNumber: params.phoneNumber, currency: params.currency ?? 'TZS' },
          transferDetails: {
            type: provider,
            amount: Math.round(params.amount),
            date: new Date().toISOString(),
          },
          externalReferenceId: params.reference,
          remarks: params.description ?? 'Vendor wallet withdrawal',
        },
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`AzamPay disbursement failed: ${message}`, 'AzamPayProvider');
      return { success: false, message };
    }
  }

  private safeCompare(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);
      if (bufA.length !== bufB.length) return false;
      return timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  public verifyCallback(
    headers: Record<string, string | string[] | undefined>,
    body?: Record<string, unknown>,
  ): boolean {
    if (!this.config.apiKey) {
      return true;
    }
    const headerValue = headers['x-api-key'] ?? headers['X-API-Key'];
    const headerSecret = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (headerSecret && this.safeCompare(headerSecret, this.config.apiKey)) {
      return true;
    }
    if (body) {
      const password = body['password'] ?? body['Password'];
      if (typeof password === 'string' && this.safeCompare(password, this.config.apiKey)) {
        return true;
      }
    }
    return false;
  }
}
