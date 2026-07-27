import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';
import * as https from 'https';
import * as http from 'http';

export interface SendSmsParams {
  to: string;
  message: string;
  tenantId?: string;
}

export interface ISmsService {
  send(params: SendSmsParams): Promise<{ success: boolean; messageId?: string }>;
  sendOtp(phone: string, otp: string): Promise<{ success: boolean }>;
}

interface AfricasTalkingConfig {
  apiKey: string;
  username: string;
  from: string;
  environment: 'sandbox' | 'production';
}

@Injectable()
export class SmsService implements ISmsService {
  private readonly config: AfricasTalkingConfig;

  constructor(private readonly logger: AppLoggerService) {
    this.config = {
      apiKey: process.env.AT_API_KEY || '',
      username: process.env.AT_USERNAME || 'sandbox',
      from: process.env.AT_SENDER_ID || 'afriMarket',
      environment: (process.env.AT_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };
  }

  private get baseUrl(): string {
    return this.config.environment === 'sandbox'
      ? 'https://api.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';
  }

  private get isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.username && this.config.username !== 'sandbox');
  }

  private formatPhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('255')) {
      if (cleaned.startsWith('0')) {
        cleaned = '255' + cleaned.substring(1);
      } else {
        cleaned = '255' + cleaned;
      }
    }
    return '+' + cleaned;
  }

  public async send(params: SendSmsParams): Promise<{ success: boolean; messageId?: string }> {
    this.logger.log(`SMS to ${params.to}: ${params.message.substring(0, 50)}...`, 'SmsService');

    if (!this.isConfigured) {
      this.logger.warn('Africa\'s Talking not configured. SMS simulated.', 'SmsService');
      return { success: true, messageId: `sim_${Date.now()}` };
    }

    const formattedPhone = this.formatPhone(params.to);

    const postData = new URLSearchParams({
      username: this.config.username,
      to: formattedPhone,
      message: params.message,
      from: this.config.from,
    }).toString();

    try {
      const response = await this.httpRequest(
        'POST',
        this.baseUrl,
        postData,
        {
          apiKey: this.config.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      );

      const recipients = response.SMSMessageData?.Recipients || [];
      const sent = recipients.find((r: any) => r.status === 'Success');

      if (sent) {
        return { success: true, messageId: sent.messageId };
      }

      this.logger.warn(`SMS failed: ${JSON.stringify(response)}`, 'SmsService');
      return { success: false };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`SMS send failed: ${message}`, 'SmsService');
      return { success: false };
    }
  }

  public async sendOtp(phone: string, otp: string): Promise<{ success: true }> {
    const message = `Your afriMarket verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
    await this.send({ to: phone, message });
    return { success: true };
  }

  public async sendOrderConfirmation(
    phone: string,
    orderId: string,
    total: number,
    currency: string = 'TZS',
  ): Promise<{ success: boolean }> {
    const message = `Order confirmed! Order #${orderId.substring(0, 8)}... Total: ${currency} ${total.toLocaleString()}. You will receive an update when your order is on the way.`;
    return this.send({ to: phone, message });
  }

  public async sendOrderStatusUpdate(
    phone: string,
    orderId: string,
    status: string,
  ): Promise<{ success: boolean }> {
    const statusMessages: Record<string, string> = {
      CONFIRMED: 'Your order has been confirmed and is being prepared.',
      PREPARING: 'Your order is being prepared by the vendor.',
      READY: 'Your order is ready for pickup by the driver.',
      OUT_FOR_DELIVERY: 'Your order is on the way! The driver is heading to you.',
      DELIVERED: 'Your order has been delivered. Enjoy!',
      CANCELLED: 'Your order has been cancelled.',
    };

    const statusMsg = statusMessages[status] || `Order status: ${status}`;
    const message = `Order #${orderId.substring(0, 8)}... ${statusMsg}`;
    return this.send({ to: phone, message });
  }

  public async sendVendorNewOrder(
    phone: string,
    orderId: string,
    total: number,
  ): Promise<{ success: boolean }> {
    const message = `New order received! Order #${orderId.substring(0, 8)}... Total: TZS ${total.toLocaleString()}. Open your vendor panel to view details.`;
    return this.send({ to: phone, message });
  }

  public async sendDriverAssignment(
    phone: string,
    orderId: string,
    pickup: string,
    delivery: string,
  ): Promise<{ success: boolean }> {
    const message = `New delivery assignment! Order #${orderId.substring(0, 8)}... Pickup: ${pickup} → Delivery: ${delivery}. Open your driver app to accept.`;
    return this.send({ to: phone, message });
  }

  private httpRequest(
    method: string,
    url: string,
    body?: string,
    headers: Record<string, string> = {},
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method,
        headers,
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
        reject(new Error('SMS request timeout'));
      });

      if (body) {
        req.write(body);
      }
      req.end();
    });
  }
}
