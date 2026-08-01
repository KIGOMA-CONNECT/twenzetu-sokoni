import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';
import { httpRequest } from '../http.util';
import { SmsMessage, SendSmsResult, SmsProvider } from '../sms-provider.interface';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  from: string;
}

@Injectable()
export class TwilioProvider implements SmsProvider {
  public readonly name = 'twilio';

  private readonly config: TwilioConfig;

  constructor(private readonly logger: AppLoggerService) {
    this.config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      from: process.env.TWILIO_FROM || '',
    };
  }

  public get isConfigured(): boolean {
    return !!(this.config.accountSid && this.config.authToken && this.config.from);
  }

  public async send(message: SmsMessage): Promise<SendSmsResult> {
    if (!this.isConfigured) {
      this.logger.warn('Twilio not configured. SMS simulated.', 'TwilioProvider');
      return { success: true, messageId: `sim_twilio_${Date.now()}`, provider: this.name, simulated: true };
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
    const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64');
    const postData = new URLSearchParams({
      To: message.to,
      From: this.config.from,
      Body: message.message,
    }).toString();

    try {
      const response = await httpRequest<{ sid?: string; error_message?: string; status?: string }>({
        method: 'POST',
        url,
        body: postData,
        formUrlEncoded: true,
        headers: { Authorization: `Basic ${auth}` },
      });

      if (response.sid) {
        return { success: true, messageId: response.sid, provider: this.name };
      }

      this.logger.warn(`Twilio SMS failed: ${JSON.stringify(response)}`, 'TwilioProvider');
      return { success: false, provider: this.name };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      this.logger.error(`Twilio SMS send failed: ${err}`, 'TwilioProvider');
      return { success: false, provider: this.name };
    }
  }
}
