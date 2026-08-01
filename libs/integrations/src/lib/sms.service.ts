import { Injectable, Optional } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';
import { CountrySmsRouterService } from './sms/country-sms.router';
import { SendSmsResult } from './sms/sms-provider.interface';

export interface SendSmsParams {
  to: string;
  message: string;
  tenantId?: string;
}

export interface ISmsService {
  send(params: SendSmsParams): Promise<SendSmsResult>;
  sendOtp(phone: string, otp: string): Promise<{ success: boolean }>;
  sendDeliveryOtp(phone: string, code: string, orderId: string): Promise<SendSmsResult>;
}

/**
 * Facade over the per-country SMS router. Keeps the historical SmsService
 * surface (`send`, `sendOtp`, order/driver templates) while routing every
 * message through the provider selected for the recipient's country.
 */
@Injectable()
export class SmsService implements ISmsService {
  private readonly router: CountrySmsRouterService;

  constructor(
    private readonly logger: AppLoggerService,
    @Optional() router?: CountrySmsRouterService,
  ) {
    this.router = router ?? new CountrySmsRouterService(logger);
  }

  public async send(params: SendSmsParams): Promise<SendSmsResult> {
    return this.router.send({ to: params.to, message: params.message, tenantId: params.tenantId });
  }

  public async sendOtp(phone: string, otp: string): Promise<{ success: boolean }> {
    const message = `Your afriMarket verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
    const result = await this.send({ to: phone, message });
    return { success: result.success };
  }

  public async sendDeliveryOtp(phone: string, code: string, orderId: string): Promise<SendSmsResult> {
    const message = `Your delivery confirmation code for order #${orderId.substring(0, 8)} is: ${code}. Share it with your driver when your order arrives so they can complete the delivery. Do not share this code with anyone else.`;
    return this.send({ to: phone, message });
  }

  public async sendOrderConfirmation(
    phone: string,
    orderId: string,
    total: number,
    currency: string = 'TZS',
  ): Promise<SendSmsResult> {
    const message = `Order confirmed! Order #${orderId.substring(0, 8)}... Total: ${currency} ${total.toLocaleString()}. You will receive an update when your order is on the way.`;
    return this.send({ to: phone, message });
  }

  public async sendOrderStatusUpdate(
    phone: string,
    orderId: string,
    status: string,
  ): Promise<SendSmsResult> {
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
  ): Promise<SendSmsResult> {
    const message = `New order received! Order #${orderId.substring(0, 8)}... Total: TZS ${total.toLocaleString()}. Open your vendor panel to view details.`;
    return this.send({ to: phone, message });
  }

  public async sendDriverAssignment(
    phone: string,
    orderId: string,
    pickup: string,
    delivery: string,
  ): Promise<SendSmsResult> {
    const message = `New delivery assignment! Order #${orderId.substring(0, 8)}... Pickup: ${pickup} → Delivery: ${delivery}. Open your driver app to accept.`;
    return this.send({ to: phone, message });
  }
}
