import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { SurgeRuleOrmEntity } from '@afri-market/marketplace-infrastructure';

@Injectable()
export class SurgeRecalcService {
  private readonly logger = new Logger(SurgeRecalcService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSurgeRecalc(): Promise<void> {
    const repo = this.dataSource.getRepository(SurgeRuleOrmEntity);

    const expiredRules = await repo.find({
      where: { isActive: true },
    });

    const now = new Date();
    let deactivated = 0;

    for (const rule of expiredRules) {
      if (rule.endHour !== null && rule.endHour !== undefined) {
        const currentHour = now.getHours();
        if (currentHour > rule.endHour) {
          rule.isActive = false;
          rule.version = rule.version + 1;
          await repo.save(rule);
          deactivated++;
          this.logger.log(`Deactivated expired surge rule: ${rule.id} (${rule.name})`);
        }
      }
    }

    if (deactivated > 0) {
      this.logger.log(`Surge recalc complete: ${deactivated} rule(s) deactivated`);
    }
  }
}
