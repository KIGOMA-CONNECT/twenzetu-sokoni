import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceApplicationModule } from '@afri-market/marketplace-application';
import { NotificationOrmEntity, PushSubscriptionOrmEntity } from '@afri-market/marketplace-infrastructure';
import { NotificationsService, PushService, MarketplaceGatewayModule } from '@afri-market/marketplace-api';
import { StaleOrderService } from './stale-order.service';
import { OtpCleanupService } from './otp-cleanup.service';
import { SurgeRecalcService } from './surge-recalc.service';
import { LoanReminderService } from './loan-reminder.service';
import { LoanAutoRepayService } from './loan-auto-repay.service';
import { PayoutSettlementService } from './payout-settlement.service';
import { PaymentTimeoutService } from './payment-timeout.service';
import { AutoDispatchService } from './auto-dispatch.service';
import { FixedDepositMaturityService } from './fixed-deposit-maturity.service';
import { SubscriptionBillingService } from './subscription-billing.service';
import { CommissionSweepService } from './commission-sweep.service';
import { CampaignDispatchService } from './campaign-dispatch.service';
import { PosShiftAutoCloseService } from './pos-shift-auto-close.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MarketplaceApplicationModule,
    MarketplaceGatewayModule,
    TypeOrmModule.forFeature([NotificationOrmEntity, PushSubscriptionOrmEntity]),
  ],
  providers: [
    StaleOrderService,
    OtpCleanupService,
    SurgeRecalcService,
    LoanReminderService,
    LoanAutoRepayService,
    PayoutSettlementService,
    PaymentTimeoutService,
    AutoDispatchService,
    FixedDepositMaturityService,
    SubscriptionBillingService,
    CommissionSweepService,
    CampaignDispatchService,
    NotificationsService,
    PushService,
    PosShiftAutoCloseService,
  ],
})
export class SchedulerModule {}
