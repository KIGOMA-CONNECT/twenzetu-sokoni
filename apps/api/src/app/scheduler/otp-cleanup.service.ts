import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, LessThan } from 'typeorm';
import { OtpOrmEntity } from '@afri-market/identity-infrastructure';

@Injectable()
export class OtpCleanupService {
  private readonly logger = new Logger(OtpCleanupService.name);

  constructor(private readonly dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleOtpCleanup(): Promise<void> {
    const repo = this.dataSource.getRepository(OtpOrmEntity);
    const cutoff = new Date(Date.now() - 10 * 60 * 1000);

    const result = await repo.delete({
      createdAt: LessThan(cutoff),
    });

    const deleted = result.affected ?? 0;
    if (deleted > 0) {
      this.logger.log(`OTP cleanup complete: ${deleted} expired OTP record(s) deleted`);
    }
  }
}
