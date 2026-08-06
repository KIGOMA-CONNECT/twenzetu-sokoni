import { AppLoggerService } from '@afri-market/core-logger';
import { httpRequest } from './http';
import {
  DisbursePaymentParams,
  IPaymentProvider,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentStatusResponse,
  ReversePaymentResult,
} from './types';

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  environment: 'sandbox' | 'production';
}

export class MpesaProvider implements IPaymentProvider {
  readonly name = 'mpesa';

  private readonly config: MpesaConfig;
  private oauthToken: string | null = null;
  private tokenExpiry = 0;

  constructor(private readonly logger: AppLoggerService) {
    const isProd = process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';
    this.config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || '',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
      shortcode: process.env.MPESA_SHORTCODE || '',
      passkey: process.env.MPESA_PASSKEY || '',
      callbackUrl: process.env.MPESA_CALLBACK_URL || '',
      environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || (isProd ? 'production' : 'sandbox'),
    };
  }

  get isConfigured(): boolean {
    return !!(this.config.consumerKey && this.config.consumerSecret);
  }

  private get baseUrl(): string {
    return this.config.environment === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';
  }

  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private generatePassword(): string {
    const timestamp = this.getTimestamp();
    const dataToEncode = `${this.config.shortcode}${this.config.passkey}${timestamp}`;
    return Buffer.from(dataToEncode).toString('base64');
  }

  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('255')) {
      return cleaned;
    }
    if (cleaned.startsWith('0')) {
      return '255' + cleaned.substring(1);
    }
    if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      return '255' + cleaned;
    }
    return cleaned;
  }

  private async getOAuthToken(): Promise<string> {
    if (this.oauthToken && Date.now() < this.tokenExpiry) {
      return this.oauthToken;
    }

    if (!this.isConfigured) {
      this.logger.warn('M-Pesa credentials not configured. Using sandbox mode.', 'MpesaProvider');
      return 'sandbox_token';
    }

    const credentials = Buffer.from(
      `${this.config.consumerKey}:${this.config.consumerSecret}`,
    ).toString('base64');

    const response = await httpRequest<{ access_token?: string; expires_in?: number }>({
      method: 'GET',
      url: `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      headers: { Authorization: `Basic ${credentials}` },
    });

    this.oauthToken = response.access_token ?? null;
    this.tokenExpiry = Date.now() + ((response.expires_in ?? 3600) * 1000) - 60000;

    return this.oauthToken!;
  }

  public async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    this.logger.log(
      `M-Pesa STK Push for ${params.phoneNumber}: ${params.amount} ${params.accountReference}`,
      'MpesaProvider',
    );

    if (!this.isConfigured) {
      this.logger.warn('M-Pesa not configured. Returning sandbox response.', 'MpesaProvider');
      return {
        reference: `ws_CO_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        success: true,
        status: 'INITIATED',
        provider: 'mpesa',
        message: 'Sandbox mode - simulated success',
      };
    }

    const token = await this.getOAuthToken();
    const timestamp = this.getTimestamp();
    const formattedPhone = this.formatPhoneNumber(params.phoneNumber);
    const password = this.generatePassword();

    const requestBody = {
      BusinessShortCode: this.config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: Math.round(params.amount),
      PartyA: formattedPhone,
      PartyB: this.config.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${this.config.callbackUrl}?orderId=${params.accountReference}`,
      AccountReference: params.accountReference,
      TransactionDesc: params.description,
    };

    try {
      const response = await httpRequest<{
        ResponseCode?: string;
        ResponseDescription?: string;
        CheckoutRequestID?: string;
        MerchantRequestID?: string;
      }>({
        method: 'POST',
        url: `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        headers: { Authorization: `Bearer ${token}` },
        body: requestBody,
      });

      this.logger.log(
        `STK Push response: ${response.ResponseCode} - ${response.CheckoutRequestID}`,
        'MpesaProvider',
      );

      return {
        reference: response.CheckoutRequestID || params.accountReference,
        success: response.ResponseCode === '0',
        status: response.ResponseCode === '0' ? 'INITIATED' : 'FAILED',
        provider: 'mpesa',
        message: response.ResponseDescription,
        raw: response,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`STK Push failed: ${message}`, 'MpesaProvider');
      return {
        reference: params.accountReference,
        success: false,
        status: 'FAILED',
        provider: 'mpesa',
        message,
      };
    }
  }

  public async checkPaymentStatus(reference: string): Promise<PaymentStatusResponse> {
    if (!this.isConfigured) {
      return { status: 'PENDING' };
    }

    const token = await this.getOAuthToken();

    try {
      const response = await httpRequest<{
        ResponseCode?: string;
        MpesaReceiptNumber?: string;
        TransactionID?: string;
      }>({
        method: 'POST',
        url: `${this.baseUrl}/mpesa/transactionstatus/v1/query`,
        headers: { Authorization: `Bearer ${token}` },
        body: { CheckoutRequestID: reference },
      });

      if (response.ResponseCode === '0') {
        return {
          status: 'SUCCESS',
          receiptNumber: response.MpesaReceiptNumber,
          transactionId: response.TransactionID,
        };
      }

      return { status: 'PENDING' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Status check failed: ${message}`, 'MpesaProvider');
      return { status: 'FAILED' };
    }
  }

  public async reversePayment(transactionId: string, amount: number, reason: string): Promise<ReversePaymentResult> {
    if (!this.isConfigured) {
      this.logger.warn('M-Pesa not configured. Simulating reversal.', 'MpesaProvider');
      return { success: true };
    }

    const token = await this.getOAuthToken();
    const password = this.generatePassword();

    const requestBody = {
      Initiator: 'afriMarket',
      SecurityCredential: password,
      CommandID: 'TransactionReversal',
      TransactionID: transactionId,
      Amount: Math.round(amount),
      ReceiverPartyType: '4',
      ReceiverIdentifier: this.config.shortcode,
      ResultURL: `${this.config.callbackUrl}/reversal-result`,
      QueueTimeOutURL: `${this.config.callbackUrl}/reversal-timeout`,
      Remarks: reason,
      Occasion: 'Refund',
    };

    try {
      await httpRequest<unknown>({
        method: 'POST',
        url: `${this.baseUrl}/mpesa/reversal/v1/request`,
        headers: { Authorization: `Bearer ${token}` },
        body: requestBody,
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Reversal failed: ${message}`, 'MpesaProvider');
      return { success: false, message };
    }
  }

  public async disburse(params: DisbursePaymentParams): Promise<ReversePaymentResult> {
    if (!this.isConfigured) {
      this.logger.warn('M-Pesa not configured. Simulating disbursement.', 'MpesaProvider');
      return { success: true, message: 'Sandbox mode - simulated M-Pesa disbursement' };
    }

    const token = await this.getOAuthToken();
    const password = this.generatePassword();

    const requestBody = {
      InitiatorName: 'afriMarket',
      SecurityCredential: password,
      CommandID: 'BusinessPayment',
      Amount: Math.round(params.amount),
      PartyA: this.config.shortcode,
      PartyB: this.formatPhoneNumber(params.phoneNumber),
      Remarks: params.description ?? 'Vendor wallet withdrawal',
      QueueTimeOutURL: `${this.config.callbackUrl}/b2c-timeout`,
      ResultURL: `${this.config.callbackUrl}/b2c-result`,
      Occasion: params.reference,
    };

    try {
      await httpRequest<unknown>({
        method: 'POST',
        url: `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
        headers: { Authorization: `Bearer ${token}` },
        body: requestBody,
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Disbursement failed: ${message}`, 'MpesaProvider');
      return { success: false, message };
    }
  }
}
