import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AiLearningService } from '../learning/ai-learning.service';

@Injectable()
export class AiQuotaService {
  private readonly logger = new Logger(AiQuotaService.name);
  private readonly dailyLimit = Number(process.env.AI_DAILY_QUOTA_PER_TENANT ?? '1000');
  private readonly userDailyLimit = Number(process.env.AI_DAILY_QUOTA_PER_USER ?? '100');
  private readonly cache = new Map<string, { count: number; day: string }>();

  constructor(private readonly learningService: AiLearningService) {}

  public async assertQuota(tenantId: string, userId?: string): Promise<void> {
    if (tenantId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
      await this.assertQuotaForKey(`tenant:${tenantId}`, tenantId, this.dailyLimit, `tenant ${tenantId}`);
    }
    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      await this.assertQuotaForKey(`user:${userId}`, tenantId, this.userDailyLimit, `user ${userId}`);
    }
  }

  private async assertQuotaForKey(keyPrefix: string, tenantId: string, limit: number, label: string): Promise<void> {
    const day = new Date().toISOString().slice(0, 10);
    const key = `${keyPrefix}:${day}`;
    const cached = this.cache.get(key);
    if (cached && cached.day === day && cached.count >= limit) {
      throw new HttpException(`AI daily quota exceeded for ${label} (${limit}/day)`, HttpStatus.TOO_MANY_REQUESTS);
    }
    let count = cached?.count ?? 0;
    try {
      const insights = await this.learningService.getInsights(tenantId, 1);
      const todayCount = insights.byModule.reduce((s, r) => s + r.count, 0);
      if (todayCount > count) count = todayCount;
    } catch (e) {
      this.logger.warn(`quota check failed for ${label}: ${(e as Error).message}`);
    }
    if (count >= limit) {
      this.cache.set(key, { count, day });
      throw new HttpException(`AI daily quota exceeded for ${label} (${limit}/day)`, HttpStatus.TOO_MANY_REQUESTS);
    }
    this.cache.set(key, { count: count + 1, day });
  }
}
