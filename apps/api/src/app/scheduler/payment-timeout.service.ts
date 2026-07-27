import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IPaymentRepository } from '@afri-market/marketplace-domain';
import { Inject } from '@nestjs/common';
import { MobileMoneyService } from '@afri-market/integrations';
import { PAYMENT_REPOSITORY } from '@afri-market/marketplace-application';

@Injectable()
export class PaymentTimeoutService {
  private readonly logger = new Logger(PaymentTimeoutService.name);

  private static readonly TIMEOUT_MS = 5 * 60 * 1000;
  private static readonly MAX_RETRY_MS = 10 * 60 * 1000;

  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    private readonly mobileMoney: MobileMoneyService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handlePaymentTimeouts(): Promise<void> {
    this.logger.log('Checking for timed-out STK push payments...');

    const now = Date.now();
    const firstCutoff = new Date(now - PaymentTimeoutService.TIMEOUT_MS);
    const maxCutoff = new Date(now - PaymentTimeoutService.MAX_RETRY_MS);

    const pendingPayments = await this.paymentRepo.findPendingOlderThan(firstCutoff, 50);

    if (pendingPayments.length === 0) {
      this.logger.log('No pending payments to check.');
      return;
    }

    this.logger.log(`Found ${pendingPayments.length} pending payment(s) older than 5 min.`);

    for (const payment of pendingPayments) {
      const initiatedAt = payment.initiatedAt;
      if (!initiatedAt) continue;

      const age = now - initiatedAt.getTime();

      try {
        if (age >= PaymentTimeoutService.MAX_RETRY_MS) {
          this.logger.warn(`Payment ${payment.id.value} timed out after ${Math.round(age / 1000)}s. Failing.`);
          payment.fail();
          await this.paymentRepo.save(payment);
          continue;
        }

        const result = await this.mobileMoney.checkPaymentStatus(payment.transactionRef || payment.id.value);
        this.logger.log(`Status for ${payment.id.value}: ${result.status}`);

        if (result.status === 'SUCCESS') {
          payment.confirmEscrow();
          await this.paymentRepo.save(payment);
          this.logger.log(`Payment ${payment.id.value} confirmed via status query.`);
        } else if (result.status === 'FAILED') {
          payment.fail();
          await this.paymentRepo.save(payment);
          this.logger.log(`Payment ${payment.id.value} failed per M-Pesa query.`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error checking payment ${payment.id.value}: ${message}`);
      }
    }

    this.logger.log('Payment timeout check complete.');
  }
}
