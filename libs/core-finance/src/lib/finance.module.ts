import { Module, Global, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionLogEntity } from './entities/commission-log.entity';
import { VendorSubscriptionTierEntity } from './entities/vendor-subscription-tier.entity';
import { VendorSubscriptionEntity } from './entities/vendor-subscription.entity';
import { SavingsAccountEntity } from './entities/savings-account.entity';
import { SavingsTransactionEntity } from './entities/savings-transaction.entity';
import { FixedDepositEntity } from './entities/fixed-deposit.entity';
import { LoanEntity } from './entities/loan.entity';
import { LoanRepaymentEntity } from './entities/loan-repayment.entity';
import { LoanProductEntity } from './entities/loan-product.entity';
import { LoanDocumentEntity } from './entities/loan-document.entity';
import { LoanWorkflowEventEntity } from './entities/loan-workflow-event.entity';
import { SubscriptionInvoiceEntity } from './entities/subscription-invoice.entity';
import { CommissionService } from './commission.service';
import { SavingsService } from './savings.service';
import { LoanService } from './loan.service';
import { VendorSubscriptionService } from './vendor-subscription.service';
import { DEFAULT_TENANT_IDS } from './tenant.constants';

export const FINANCE_ENTITIES = [
  CommissionLogEntity,
  VendorSubscriptionTierEntity,
  VendorSubscriptionEntity,
  SavingsAccountEntity,
  SavingsTransactionEntity,
  FixedDepositEntity,
  LoanEntity,
  LoanRepaymentEntity,
  LoanProductEntity,
  LoanDocumentEntity,
  LoanWorkflowEventEntity,
  SubscriptionInvoiceEntity,
];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(FINANCE_ENTITIES)],
  providers: [CommissionService, SavingsService, LoanService, VendorSubscriptionService],
  exports: [CommissionService, SavingsService, LoanService, VendorSubscriptionService],
})
export class FinanceModule implements OnModuleInit {
  private readonly logger = new Logger(FinanceModule.name);

  constructor(
    private readonly subs: VendorSubscriptionService,
    private readonly loans: LoanService,
  ) {}

  public async onModuleInit(): Promise<void> {
    try {
      await this.subs.seedDefaultTiers();
      this.logger.log('Vendor subscription tiers ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Skipping subscription tier seed: ${message}`);
    }
    try {
      for (const tenantId of DEFAULT_TENANT_IDS) {
        const count = await this.loans.seedDefaultProducts(tenantId);
        if (count > 0) this.logger.log(`Seeded ${count} default loan products for ${tenantId}`);
      }
      this.logger.log('Loan product catalog ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Skipping loan product seed: ${message}`);
    }
  }
}
