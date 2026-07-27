import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketplaceApplicationModule } from '@afri-market/marketplace-application';
import { StaleOrderService } from './stale-order.service';
import { OtpCleanupService } from './otp-cleanup.service';
import { SurgeRecalcService } from './surge-recalc.service';
import { LoanReminderService } from './loan-reminder.service';
import { PayoutSettlementService } from './payout-settlement.service';
import { PaymentTimeoutService } from './payment-timeout.service';

@Module({
  imports: [ScheduleModule.forRoot(), MarketplaceApplicationModule],
  providers: [
    StaleOrderService,
    OtpCleanupService,
    SurgeRecalcService,
    LoanReminderService,
    PayoutSettlementService,
    PaymentTimeoutService,
  ],
})
export class SchedulerModule {}
