import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';
import * as https from 'https';
import * as http from 'http';

export interface InitiateStkPushParams {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  description: string;
  tenantId?: string;
}

export interface PaymentStatusResponse {
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transactionId?: string;
  receiptNumber?: string;
}

export interface StkPushResult {
  checkoutRequestId: string;
  responseCode: string;
  responseDescription?: string;
  merchantRequestID?: string;
}

export interface IMobileMoneyService {
  initiateStkPush(params: InitiateStkPushParams): Promise<StkPushResult>;
  checkPaymentStatus(checkoutRequestId: string): Promise<PaymentStatusResponse>;
  reversePayment(transactionId: string, amount: number, reason: string): Promise<{ success: boolean }>;
}

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  environment: 'sandbox' | 'production';
}

@Injectable()
export class MobileMoneyService implements IMobileMoneyService {
  private readonly config: MpesaConfig;
  private oauthToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private readonly logger: AppLoggerService) {
    this.config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || '',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
      shortcode: process.env.MPESA_SHORTCODE || '174379',
      passkey: process.env.MPESA_PASSKEY || '',
      callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/webhooks/mpesa',
      environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };
  }

  private get baseUrl(): string {
    return this.config.environment === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';
  }

  private get isConfigured(): boolean {
    return !!(this.config.consumerKey && this.config.consumerSecret);
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
    let cleaned = phone.replace(/\D/g, '');
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
      this.logger.warn('M-Pesa credentials not configured. Using sandbox mode.', 'MobileMoneyService');
      return 'sandbox_token';
    }

    const credentials = Buffer.from(
      `${this.config.consumerKey}:${this.config.consumerSecret}`
    ).toString('base64');

    const response = await this.httpRequest(
      'GET',
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      undefined,
      { Authorization: `Basic ${credentials}` },
    );

    this.oauthToken = response.access_token;
    this.tokenExpiry = Date.now() + (response.expires_in * 1000) - 60000;

    return this.oauthToken!;
  }

  public async initiateStkPush(params: InitiateStkPushParams): Promise<StkPushResult> {
    this.logger.log(
      `STK Push for ${params.phoneNumber}: ${params.amount} ${params.accountReference}`,
      'MobileMoneyService',
    );

    if (!this.isConfigured) {
      this.logger.warn(
        'M-Pesa not configured. Returning sandbox response.',
        'MobileMoneyService',
      );
      return {
        checkoutRequestId: `ws_CO_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        responseCode: '0',
        responseDescription: 'Sandbox mode - simulated success',
        merchantRequestID: `mr_${Date.now()}`,
      };
    }

    const token = await this.getOAuthToken();
    const formattedPhone = this.formatPhoneNumber(params.phoneNumber);
    const timestamp = this.getTimestamp();
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
      const response = await this.httpRequest(
        'POST',
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        requestBody,
        { Authorization: `Bearer ${token}` },
      );

      this.logger.log(
        `STK Push response: ${response.ResponseCode} - ${response.CheckoutRequestID}`,
        'MobileMoneyService',
      );

      return {
        checkoutRequestId: response.CheckoutRequestID,
        responseCode: response.ResponseCode,
        responseDescription: response.ResponseDescription,
        merchantRequestID: response.MerchantRequestID,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `STK Push failed: ${message}`,
        'MobileMoneyService',
      );
      throw error;
    }
  }

  public async checkPaymentStatus(checkoutRequestId: string): Promise<PaymentStatusResponse> {
    if (!this.isConfigured) {
      return { status: 'PENDING' };
    }

    const token = await this.getOAuthToken();
    const requestBody = {
      CheckoutRequestID: checkoutRequestId,
    };

    try {
      const response = await this.httpRequest(
        'POST',
        `${this.baseUrl}/mpesa/transactionstatus/v1/query`,
        requestBody,
        { Authorization: `Bearer ${token}` },
      );

      if (response.ResponseCode === '0') {
        return {
          status: 'SUCCESS',
          receiptNumber: response.MpesaReceiptNumber,
          transactionId: response.TransactionID,
        };
      }

      return { status: 'PENDING' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Status check failed: ${message}`,
        'MobileMoneyService',
      );
      return { status: 'FAILED' };
    }
  }

  public async reversePayment(
    transactionId: string,
    amount: number,
    reason: string,
  ): Promise<{ success: boolean }> {
    if (!this.isConfigured) {
      this.logger.warn('M-Pesa not configured. Simulating reversal.', 'MobileMoneyService');
      return { success: true };
    }

    const token = await this.getOAuthToken();
    const timestamp = this.getTimestamp();
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
      await this.httpRequest(
        'POST',
        `${this.baseUrl}/mpesa/reversal/v1/request`,
        requestBody,
        { Authorization: `Bearer ${token}` },
      );
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Reversal failed: ${message}`, 'MobileMoneyService');
      return { success: false };
    }
  }

  private httpRequest(
    method: string,
    url: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ raw: data });
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }
}
