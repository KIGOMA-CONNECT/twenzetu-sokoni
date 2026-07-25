import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, LessThan } from 'typeorm';
import { OrderOrmEntity } from '@afri-market/marketplace-infrastructure';

@Injectable()
export class StaleOrderService {
  private readonly logger = new Logger(StaleOrderService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleStaleOrders(): Promise<void> {
    const repo = this.dataSource.getRepository(OrderOrmEntity);
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const staleOrders = await repo.find({
      where: {
        status: 'PLACED',
        createdAt: LessThan(cutoff),
      },
    });

    if (staleOrders.length === 0) {
      return;
    }

    for (const order of staleOrders) {
      order.status = 'CANCELLED';
      order.version = order.version + 1;
      await repo.save(order);
      this.logger.log(`Auto-cancelled stale order ${order.id} (created ${order.createdAt})`);
    }

    this.logger.log(`Stale order cleanup complete: ${staleOrders.length} order(s) cancelled`);
  }
}
