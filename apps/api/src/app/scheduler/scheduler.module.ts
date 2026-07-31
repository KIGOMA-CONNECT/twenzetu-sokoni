import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceApplicationModule } from '@afri-market/marketplace-application';
import { NotificationOrmEntity } from '@afri-market/marketplace-infrastructure';
import { NotificationsService, MarketplaceGatewayModule } from '@afri-market/marketplace-api';
import { StaleOrderService } from './stale-order.service';
import { OtpCleanupService } from './otp-cleanup.service';
import { SurgeRecalcService } from './surge-recalc.service';
import { LoanReminderService } from './loan-reminder.service';
import { PayoutSettlementService } from './payout-settlement.service';
import { PaymentTimeoutService } from './payment-timeout.service';
import { AutoDispatchService } from './auto-dispatch.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MarketplaceApplicationModule,
    MarketplaceGatewayModule,
    TypeOrmModule.forFeature([NotificationOrmEntity]),
  ],
  providers: [
    StaleOrderService,
    OtpCleanupService,
    SurgeRecalcService,
    LoanReminderService,
    PayoutSettlementService,
    PaymentTimeoutService,
    AutoDispatchService,
    NotificationsService,
  ],
})
export class SchedulerModule {}
