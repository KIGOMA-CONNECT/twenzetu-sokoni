import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';
import { httpRequest } from '../http.util';
import { SmsMessage, SendSmsResult, SmsProvider } from '../sms-provider.interface';

interface TermiiConfig {
  apiKey: string;
  senderId: string;
}

@Injectable()
export class TermiiProvider implements SmsProvider {
  public readonly name = 'termii';

  private readonly config: TermiiConfig;

  constructor(private readonly logger: AppLoggerService) {
    this.config = {
      apiKey: process.env.TERMII_API_KEY || '',
      senderId: process.env.TERMII_SENDER_ID || 'afriMarket',
    };
  }

  public get isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  public async send(message: SmsMessage): Promise<SendSmsResult> {
    if (!this.isConfigured) {
      this.logger.warn('Termii not configured. SMS simulated.', 'TermiiProvider');
      return { success: true, messageId: `sim_termii_${Date.now()}`, provider: this.name, simulated: true };
    }

    const url = 'https://api.ng.termii.com/api/sms/send';

    try {
      const response = await httpRequest<{ message_id?: string; status?: string; message?: string }>({
        method: 'POST',
        url,
        body: {
          to: message.to,
          from: this.config.senderId,
          sms: message.message,
          type: 'plain',
          channel: 'generic',
          api_key: this.config.apiKey,
        },
      });

      if (response.message_id) {
        return { success: true, messageId: response.message_id, provider: this.name };
      }

      this.logger.warn(`Termii SMS failed: ${JSON.stringify(response)}`, 'TermiiProvider');
      return { success: false, provider: this.name };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      this.logger.error(`Termii SMS send failed: ${err}`, 'TermiiProvider');
      return { success: false, provider: this.name };
    }
  }
}
