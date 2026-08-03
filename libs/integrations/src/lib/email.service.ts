import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';
import { defaultCurrency } from './currencies';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  tenantId?: string;
}

export interface IEmailService {
  send(params: SendEmailParams): Promise<{ success: boolean }>;
  sendWelcome(to: string, name: string): Promise<{ success: boolean }>;
  sendOrderConfirmation(to: string, orderId: string, total: number, currency?: string): Promise<{ success: boolean }>;
  sendPasswordReset(to: string, resetLink: string): Promise<{ success: boolean }>;
}

const WELCOME_TEMPLATE = (name: string) => `<html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
<div style="max-width:600px;margin:auto;background:white;border-radius:8px;overflow:hidden">
<div style="background:#1e293b;padding:20px;text-align:center">
<h1 style="color:white;margin:0">afriMarket</h1>
</div>
<div style="padding:30px">
<h2>Welcome, ${name}!</h2>
<p>You've joined Africa's fastest-growing marketplace. Start browsing vendors, placing orders, and earning loyalty points today.</p>
<a href="{{APP_URL}}" style="display:inline-block;background:#22c55e;color:white;padding:12px 24px;text-decoration:none;border-radius:6px">Get Started</a>
</div>
<div style="background:#f8f8f8;padding:15px;text-align:center;color:#666;font-size:12px">
<p>afriMarket — Empowering African Commerce</p>
</div>
</div></body></html>`;

const ORDER_CONFIRMATION_TEMPLATE = (orderId: string, total: number, currency: string) =>
  `<html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
<div style="max-width:600px;margin:auto;background:white;border-radius:8px;overflow:hidden">
<div style="background:#1e293b;padding:20px;text-align:center">
<h1 style="color:white;margin:0">Order Confirmed</h1>
</div>
<div style="padding:30px">
<h2>Thank you for your order!</h2>
<p>Order <strong>#${orderId}</strong></p>
<p>Total: <strong>${currency} ${total.toLocaleString()}</strong></p>
<p>Track your order in real-time from your dashboard.</p>
<a href="{{APP_URL}}/orders/${orderId}/tracking" style="display:inline-block;background:#22c55e;color:white;padding:12px 24px;text-decoration:none;border-radius:6px">Track Order</a>
</div>
<div style="background:#f8f8f8;padding:15px;text-align:center;color:#666;font-size:12px">
<p>afriMarket — Empowering African Commerce</p>
</div>
</div></body></html>`;

const PASSWORD_RESET_TEMPLATE = (resetLink: string) =>
  `<html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
<div style="max-width:600px;margin:auto;background:white;border-radius:8px;overflow:hidden">
<div style="background:#1e293b;padding:20px;text-align:center">
<h1 style="color:white;margin:0">Password Reset</h1>
</div>
<div style="padding:30px">
<p>Click the link below to reset your password. This link expires in 1 hour.</p>
<a href="${resetLink}" style="display:inline-block;background:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px">Reset Password</a>
<p style="margin-top:20px;font-size:12px;color:#666">If you didn't request this, ignore this email.</p>
</div>
</div></body></html>`;

@Injectable()
export class EmailService implements IEmailService {
  private readonly appUrl: string;
  private transporter: any;

  constructor(private readonly logger: AppLoggerService) {
    this.appUrl = process.env['APP_URL'] || 'http://localhost:4200';
    this.initTransporter();
  }

  private initTransporter(): void {
    const host = process.env['SMTP_HOST'];
    const port = process.env['SMTP_PORT'];
    const user = process.env['SMTP_USER'];
    const pass = process.env['SMTP_PASS'];

    if (host && user && pass) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy optional dep
        const nodemailer = require('nodemailer');
        this.transporter = nodemailer.createTransport({
          host,
          port: Number(port) || 587,
          secure: Number(port) === 465,
          auth: { user, pass },
        });
        this.logger.log(`SMTP configured: ${host}:${port}`);
      } catch {
        this.logger.warn('nodemailer not available, emails will be logged only');
      }
    } else {
      this.logger.warn('SMTP not configured, emails will be logged only');
    }
  }

  public async send(params: SendEmailParams): Promise<{ success: boolean }> {
    this.logger.log(`Email to ${params.to}: ${params.subject}`, 'EmailService');

    if (!this.transporter) {
      return { success: true };
    }

    try {
      await this.transporter.sendMail({
        from: process.env['SMTP_FROM'] || 'noreply@afrimarket.co.tz',
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      return { success: true };
    } catch (err) {
      this.logger.error(`Failed to send email to ${params.to}: ${(err as Error).message}`);
      return { success: false };
    }
  }

  public async sendWelcome(to: string, name: string): Promise<{ success: boolean }> {
    const html = WELCOME_TEMPLATE(name).replace(/\{\{APP_URL\}\}/g, this.appUrl);
    return this.send({ to, subject: `Welcome to afriMarket, ${name}!`, html });
  }

  public async sendOrderConfirmation(to: string, orderId: string, total: number, currency: string = defaultCurrency()): Promise<{ success: boolean }> {
    const html = ORDER_CONFIRMATION_TEMPLATE(orderId, total, currency).replace(/\{\{APP_URL\}\}/g, this.appUrl);
    return this.send({ to, subject: `Order #${orderId.slice(0, 8)} confirmed`, html });
  }

  public async sendPasswordReset(to: string, resetLink: string): Promise<{ success: boolean }> {
    const html = PASSWORD_RESET_TEMPLATE(resetLink);
    return this.send({ to, subject: 'Reset your afriMarket password', html });
  }
}
