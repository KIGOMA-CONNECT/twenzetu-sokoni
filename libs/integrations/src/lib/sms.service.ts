import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';

export interface SendSmsParams {
  to: string;
  message: string;
  tenantId?: string;
}

export interface ISmsService {
  send(params: SendSmsParams): Promise<{ success: boolean; messageId?: string }>;
  sendOtp(phone: string, otp: string): Promise<{ success: boolean }>;
}

@Injectable()
export class SmsService implements ISmsService {
  constructor(private readonly logger: AppLoggerService) {}

  public async send(params: SendSmsParams): Promise<{ success: boolean; messageId?: string }> {
    this.logger.log(`SMS sent to ${params.to}`, 'SmsService');
    return { success: true, messageId: `sms_${Date.now()}` };
  }

  public async sendOtp(phone: string, _otp: string): Promise<{ success: boolean }> {
    this.logger.log(`OTP sent to ${phone}`, 'SmsService');
    return { success: true };
  }
}
