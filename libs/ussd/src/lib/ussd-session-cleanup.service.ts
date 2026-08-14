import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UssdSessionService } from './ussd-session.service';

@Injectable()
export class UssdSessionCleanupService {
  private readonly logger = new Logger(UssdSessionCleanupService.name);

  constructor(private readonly sessions: UssdSessionService) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async handleCleanup(): Promise<void> {
    const deleted = await this.sessions.cleanupExpired();
    if (deleted > 0) {
      this.logger.log(`USSD session cleanup removed ${deleted} expired session(s)`);
    }
  }
}
