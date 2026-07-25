import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { StaleOrderService } from './stale-order.service';
import { OtpCleanupService } from './otp-cleanup.service';
import { SurgeRecalcService } from './surge-recalc.service';
import { LoanReminderService } from './loan-reminder.service';
import { PayoutSettlementService } from './payout-settlement.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    StaleOrderService,
    OtpCleanupService,
    SurgeRecalcService,
    LoanReminderService,
    PayoutSettlementService,
  ],
})
export class SchedulerModule {}
