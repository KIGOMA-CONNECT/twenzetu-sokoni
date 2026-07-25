import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  tenantId?: string;
}

export interface IEmailService {
  send(params: SendEmailParams): Promise<{ success: boolean }>;
  sendWelcome(to: string, name: string): Promise<{ success: boolean }>;
  sendOrderConfirmation(to: string, orderId: string, total: number): Promise<{ success: boolean }>;
}

@Injectable()
export class EmailService implements IEmailService {
  constructor(private readonly logger: AppLoggerService) {}

  public async send(params: SendEmailParams): Promise<{ success: boolean }> {
    this.logger.log(`Email to ${params.to}: ${params.subject}`, 'EmailService');
    return { success: true };
  }

  public async sendWelcome(to: string, name: string): Promise<{ success: boolean }> {
    return this.send({ to, subject: `Welcome ${name}!`, html: `<h1>Welcome to afriMarket!</h1>` });
  }

  public async sendOrderConfirmation(to: string, orderId: string, total: number): Promise<{ success: boolean }> {
    return this.send({ to, subject: `Order ${orderId}`, html: `<h1>Order ${total} TZS confirmed</h1>` });
  }
}
