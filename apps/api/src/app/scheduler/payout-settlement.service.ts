import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class PayoutSettlementService {
  private readonly logger = new Logger(PayoutSettlementService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { waitForCompletion: true })
  async handlePayoutSettlement(): Promise<void> {
    const wallets = await this.dataSource.query(
      `SELECT w.id, w.tenant_id, w.owner_id, w.owner_type, w.balance
       FROM wallets w
       WHERE w.balance > 0
         AND (
           EXISTS (SELECT 1 FROM vendors v WHERE v.id = w.owner_id AND v.tenant_id = w.tenant_id)
           OR EXISTS (SELECT 1 FROM users u WHERE u.id = w.owner_id AND u.role = 'driver' AND u.tenant_id = w.tenant_id)
         )
       ORDER BY w.updated_at ASC
       LIMIT 500`,
    );

    if (wallets.length === 0) {
      this.logger.log('No vendor/driver wallets with pending balance to settle');
      return;
    }

    let totalSettled = 0;
    let settledCount = 0;

    for (const wallet of wallets) {
      const balance = Number(wallet.balance);
      if (balance <= 0) continue;

      const settled = await this.dataSource.transaction(async (manager) => {
        const rows = await manager.query(
          `UPDATE wallets SET balance = 0, version = version + 1
           WHERE id = $1 AND balance > 0
           RETURNING id`,
          [wallet.id],
        );
        if (!Array.isArray(rows) || rows.length === 0) return false;

        await manager.query(
          `INSERT INTO wallet_transactions (id, owner_id, owner_type, type, amount, balance_before, balance_after, description, reference_type, tenant_id, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, 'DEBIT', $3, $3, 0, 'Daily payout settlement', 'payout', $4, NOW(), NOW())`,
          [wallet.owner_id, wallet.owner_type, balance, wallet.tenant_id],
        );

        await manager.query(
          `INSERT INTO wallet_withdrawals (tenant_id, user_id, amount, phone_number, provider, reference, status, message)
           VALUES ($1, $2, $3, 'internal-settlement', 'internal', gen_random_uuid()::text, 'COMPLETED', 'Automated daily payout settlement')`,
          [wallet.tenant_id, wallet.owner_id, balance],
        );

        return true;
      });

      if (settled) {
        totalSettled += balance;
        settledCount++;
        this.logger.log(`Settled ${balance} TZS for ${wallet.owner_type} ${wallet.owner_id}`);
      }
    }

    this.logger.log(`Payout settlement complete: ${settledCount} wallet(s), total ${totalSettled} TZS settled`);
  }
}
