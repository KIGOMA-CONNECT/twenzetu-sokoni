import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class StaleOrderService {
  private readonly logger = new Logger(StaleOrderService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_HOUR, { waitForCompletion: true })
  async handleStaleOrders(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.dataSource.query(
      `UPDATE orders SET status = 'CANCELLED', version = version + 1, updated_at = NOW()
       WHERE status = 'PLACED' AND created_at < $1
       RETURNING id`,
      [cutoff],
    );

    const affected = Array.isArray(result) ? result.length : 0;
    if (affected > 0) {
      this.logger.log(`Auto-cancelled ${affected} stale order(s) (created before ${cutoff.toISOString()})`);
    }
  }
}
