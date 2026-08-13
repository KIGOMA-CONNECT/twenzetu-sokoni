import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

interface ReleasedPaymentRow {
  id: string;
  tenant_id: string;
  order_id: string;
  vendor_id: string;
  system_commission: string;
  vendor_net: string;
  confirmed_at: Date | null;
  updated_at: Date;
}

@Injectable()
export class CommissionSweepService {
  private readonly logger = new Logger(CommissionSweepService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron('*/10 * * * *', { waitForCompletion: true })
  async handleCommissionSweep(): Promise<void> {
    const rows = (await this.dataSource.query(
      `SELECT p.id, p.tenant_id, p.order_id, p.vendor_id, p.system_commission, p.vendor_net,
              p.confirmed_at, p.updated_at
       FROM payments p
       WHERE p.status = 'RELEASED'
         AND p.system_commission > 0
         AND NOT EXISTS (
           SELECT 1 FROM commission_logs cl WHERE cl.order_id = p.order_id
         )
       ORDER BY p.updated_at ASC
       LIMIT 500`,
    )) as ReleasedPaymentRow[];

    if (rows.length === 0) {
      this.logger.log('No released payments awaiting commission logging');
      return;
    }

    let logged = 0;

    for (const row of rows) {
      const commissionAmount = Math.round(Number(row.system_commission) * 100) / 100;
      const orderAmount = Math.round((Number(row.vendor_net) + commissionAmount) * 100) / 100;
      if (orderAmount <= 0) continue;

      const rate = Math.round((commissionAmount / orderAmount) * 10000) / 10000;
      const deductedAt = row.confirmed_at ?? row.updated_at ?? new Date();

      await this.dataSource.query(
        `INSERT INTO commission_logs
           (id, tenant_id, order_id, payer_type, payer_id, order_amount, commission_rate, commission_amount, status, deducted_at, created_at)
         SELECT gen_random_uuid(), $1, $2, 'vendor', $3, $4, $5, $6, 'deducted', $7, NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM commission_logs cl WHERE cl.order_id = $2
         )`,
        [row.tenant_id, row.order_id, row.vendor_id, orderAmount, rate, commissionAmount, deductedAt],
      );

      logged += 1;
      this.logger.log(`Commission logged: vendor ${row.vendor_id} - Tsh ${commissionAmount} from order ${row.order_id}`);
    }

    this.logger.log(`Commission sweep complete: ${logged} commission record(s) written`);
  }
}
