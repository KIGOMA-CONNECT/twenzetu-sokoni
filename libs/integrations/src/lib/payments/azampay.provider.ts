import { AppLoggerService } from '@afri-market/core-logger';
import { httpRequest } from './http';
import {
  AZAMPAY_PROVIDER_MAP,
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
      this.logger.warn('AzamPay not configured. Simulating initiation.', 'AzamPayProvider');
      return {
        reference: `azp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        success: true,
        status: 'INITIATED',
        provider,
        message: 'Sandbox mode - simulated AzamPay checkout',
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

  public async checkPaymentStatus(reference: string): Promise<PaymentStatusResponse> {
    this.logger.log(`AzamPay status poll for ${reference} (callback-driven)`, 'AzamPayProvider');
    return { status: 'PENDING' };
  }

  public async reversePayment(transactionId: string, amount: number, reason: string): Promise<ReversePaymentResult> {
    if (!this.isConfigured) {
      this.logger.warn('AzamPay not configured. Simulating reversal.', 'AzamPayProvider');
      return { success: true };
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
      this.logger.warn('AzamPay not configured. Simulating disbursement.', 'AzamPayProvider');
      return { success: true, message: 'Sandbox mode - simulated AzamPay disbursement' };
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

  public verifyCallback(
    headers: Record<string, string | string[] | undefined>,
    body?: Record<string, unknown>,
  ): boolean {
    if (!this.config.apiKey) {
      return true;
    }
    const headerValue = headers['x-api-key'] ?? headers['X-API-Key'];
    const headerSecret = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (headerSecret && headerSecret === this.config.apiKey) {
      return true;
    }
    if (body) {
      const password = body['password'] ?? body['Password'];
      if (typeof password === 'string' && password === this.config.apiKey) {
        return true;
      }
    }
    return false;
  }
}
