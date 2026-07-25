import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@afri-market/core-logger';

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

export interface IMobileMoneyService {
  initiateStkPush(params: InitiateStkPushParams): Promise<{ checkoutRequestId: string; responseCode: string }>;
  checkPaymentStatus(checkoutRequestId: string): Promise<PaymentStatusResponse>;
  reversePayment(transactionId: string, amount: number, reason: string): Promise<{ success: boolean }>;
}

@Injectable()
export class MobileMoneyService implements IMobileMoneyService {
  constructor(private readonly logger: AppLoggerService) {}

  public async initiateStkPush(params: InitiateStkPushParams): Promise<{ checkoutRequestId: string; responseCode: string }> {
    this.logger.log(`STK Push for ${params.phoneNumber}: ${params.amount}`, 'MobileMoneyService');
    return { checkoutRequestId: `stk_${Date.now()}`, responseCode: '0' };
  }

  public async checkPaymentStatus(checkoutRequestId: string): Promise<PaymentStatusResponse> {
    this.logger.log(`Checking status for ${checkoutRequestId}`, 'MobileMoneyService');
    return { status: 'PENDING' };
  }

  public async reversePayment(transactionId: string, amount: number, reason: string): Promise<{ success: boolean }> {
    this.logger.log(`Reversal: ${transactionId} ${amount} - ${reason}`, 'MobileMoneyService');
    return { success: true };
  }
}
