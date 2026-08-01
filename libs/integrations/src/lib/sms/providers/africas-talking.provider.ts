import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';
import { httpRequest } from '../http.util';
import { SmsMessage, SendSmsResult, SmsProvider } from '../sms-provider.interface';

interface AfricasTalkingConfig {
  apiKey: string;
  username: string;
  from: string;
  environment: 'sandbox' | 'production';
}

@Injectable()
export class AfricasTalkingProvider implements SmsProvider {
  public readonly name = 'africastalking';

  private readonly config: AfricasTalkingConfig;

  constructor(private readonly logger: AppLoggerService) {
    this.config = {
      apiKey: process.env.AT_API_KEY || '',
      username: process.env.AT_USERNAME || 'sandbox',
      from: process.env.AT_SENDER_ID || 'afriMarket',
      environment: (process.env.AT_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    };
  }

  public get isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.username && this.config.username !== 'sandbox');
  }

  private get baseUrl(): string {
    return 'https://api.africastalking.com/version1/messaging';
  }

  public async send(message: SmsMessage): Promise<SendSmsResult> {
    if (!this.isConfigured) {
      this.logger.warn("Africa's Talking not configured. SMS simulated.", 'AfricasTalkingProvider');
      return { success: true, messageId: `sim_${Date.now()}`, provider: this.name, simulated: true };
    }

    const postData = new URLSearchParams({
      username: this.config.username,
      to: message.to,
      message: message.message,
      from: this.config.from,
    }).toString();

    try {
      const response = await httpRequest<{ SMSMessageData?: { Recipients?: Array<{ status: string; messageId: string }> } }>({
        method: 'POST',
        url: this.baseUrl,
        body: postData,
        formUrlEncoded: true,
        headers: {
          apiKey: this.config.apiKey,
          Accept: 'application/json',
        },
      });

      const recipients = response.SMSMessageData?.Recipients || [];
      const sent = recipients.find((r) => r.status === 'Success');
      if (sent) {
        return { success: true, messageId: sent.messageId, provider: this.name };
      }

      this.logger.warn(`AfricasTalking SMS failed: ${JSON.stringify(response)}`, 'AfricasTalkingProvider');
      return { success: false, provider: this.name };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      this.logger.error(`AfricasTalking SMS send failed: ${err}`, 'AfricasTalkingProvider');
      return { success: false, provider: this.name };
    }
  }
}
