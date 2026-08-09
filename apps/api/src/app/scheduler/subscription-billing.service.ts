import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VendorSubscriptionService } from '@afri-market/core-finance';

@Injectable()
export class SubscriptionBillingService {
  private readonly logger = new Logger(SubscriptionBillingService.name);

  constructor(private readonly subscriptions: VendorSubscriptionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleBilling(): Promise<void> {
    const count = await this.subscriptions.billDueSubscriptions();
    if (count > 0) {
      this.logger.log(`Subscription billing sweep complete: ${count} renewed`);
    }
  }
}
