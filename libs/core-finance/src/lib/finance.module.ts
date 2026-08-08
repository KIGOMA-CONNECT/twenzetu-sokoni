import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionLogEntity } from './entities/commission-log.entity';
import { VendorSubscriptionTierEntity } from './entities/vendor-subscription-tier.entity';
import { VendorSubscriptionEntity } from './entities/vendor-subscription.entity';
import { SavingsAccountEntity } from './entities/savings-account.entity';
import { SavingsTransactionEntity } from './entities/savings-transaction.entity';
import { FixedDepositEntity } from './entities/fixed-deposit.entity';
import { LoanEntity } from './entities/loan.entity';
import { LoanRepaymentEntity } from './entities/loan-repayment.entity';
import { CommissionService } from './commission.service';
import { SavingsService } from './savings.service';
import { LoanService } from './loan.service';
import { VendorSubscriptionService } from './vendor-subscription.service';

export const FINANCE_ENTITIES = [
  CommissionLogEntity,
  VendorSubscriptionTierEntity,
  VendorSubscriptionEntity,
  SavingsAccountEntity,
  SavingsTransactionEntity,
  FixedDepositEntity,
  LoanEntity,
  LoanRepaymentEntity,
];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(FINANCE_ENTITIES)],
  providers: [CommissionService, SavingsService, LoanService, VendorSubscriptionService],
  exports: [CommissionService, SavingsService, LoanService, VendorSubscriptionService],
})
export class FinanceModule {}
