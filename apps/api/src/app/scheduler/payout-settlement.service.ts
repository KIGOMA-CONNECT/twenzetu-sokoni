import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class PayoutSettlementService {
  private readonly logger = new Logger(PayoutSettlementService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePayoutSettlement(): Promise<void> {
    const wallets = await this.dataSource
      .createQueryBuilder()
      .select('*')
      .from('wallets', 'w')
      .where('w.balance > 0')
      .getRawMany();

    if (wallets.length === 0) {
      this.logger.log('No wallets with pending balance to settle');
      return;
    }

    let totalSettled = 0;
    let settledCount = 0;

    for (const wallet of wallets) {
      const balance = Number(wallet.balance);
      if (balance <= 0) continue;

      const tx = await this.dataSource.query(
        `INSERT INTO wallet_transactions (id, owner_id, owner_type, type, amount, balance_before, balance_after, description, reference_type, tenant_id, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'DEBIT', $3, $3, 0, 'Daily payout settlement', 'payout', $4, NOW(), NOW())
         RETURNING id`,
        [wallet.owner_id, wallet.owner_type, balance, wallet.tenant_id],
      );

      await this.dataSource.query(
        `UPDATE wallets SET balance = 0, version = version + 1 WHERE owner_id = $1 AND owner_type = $2`,
        [wallet.owner_id, wallet.owner_type],
      );

      totalSettled += balance;
      settledCount++;
      this.logger.log(`Settled ${balance} TZS for ${wallet.owner_type} ${wallet.owner_id} (tx: ${tx[0]?.id ?? 'N/A'})`);
    }

    this.logger.log(`Payout settlement complete: ${settledCount} wallet(s), total ${totalSettled} TZS settled`);
  }
}
