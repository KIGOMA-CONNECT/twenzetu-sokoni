import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, MoreThan } from 'typeorm';
import { WalletOrmEntity } from '@afri-market/marketplace-infrastructure';

@Injectable()
export class PayoutSettlementService {
  private readonly logger = new Logger(PayoutSettlementService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePayoutSettlement(): Promise<void> {
    const repo = this.dataSource.getRepository(WalletOrmEntity);

    const wallets = await repo.find({
      where: {
        balance: MoreThan(0),
      },
    });

    if (wallets.length === 0) {
      return;
    }

    let totalSettlement = 0;

    for (const wallet of wallets) {
      const amount = Number(wallet.balance);
      totalSettlement += amount;
      this.logger.log(
        `Settlement for ${wallet.ownerType} ${wallet.ownerId}: ${amount} ${wallet.currency}`,
      );
    }

    this.logger.log(`Payout settlement complete: ${wallets.length} wallet(s), total ${totalSettlement}`);
  }
}
