import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SavingsService } from '@afri-market/core-finance';

@Injectable()
export class FixedDepositMaturityService {
  private readonly logger = new Logger(FixedDepositMaturityService.name);

  constructor(private readonly savings: SavingsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMaturity(): Promise<void> {
    const count = await this.savings.matureDueDeposits();
    if (count > 0) {
      this.logger.log(`Fixed deposit maturity sweep complete: ${count} matured`);
    }
  }
}
