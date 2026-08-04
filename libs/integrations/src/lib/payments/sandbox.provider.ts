import { AppLoggerService } from '@afri-market/core-logger';
import {
  IPaymentProvider,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentStatusResponse,
  ReversePaymentResult,
} from './types';

export class SandboxPaymentProvider implements IPaymentProvider {
  readonly name = 'sandbox';

  constructor(private readonly logger: AppLoggerService) {}

  get isConfigured(): boolean {
    return true;
  }

  public async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    this.logger.warn(
      `Payment simulated (sandbox) via ${params.provider ?? 'mpesa'} for ${params.phoneNumber}`,
      'SandboxPaymentProvider',
    );
    return {
      reference: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      success: true,
      status: 'INITIATED',
      provider: params.provider ?? 'mpesa',
      message: 'Sandbox mode - simulated initiation',
    };
  }

  public async checkPaymentStatus(_reference: string): Promise<PaymentStatusResponse> {
    return { status: 'PENDING' };
  }

  public async reversePayment(
    transactionId: string,
    _amount: number,
    _reason: string,
  ): Promise<ReversePaymentResult> {
    this.logger.warn(`Reversal simulated (sandbox) for ${transactionId}`, 'SandboxPaymentProvider');
    return { success: true };
  }
}
