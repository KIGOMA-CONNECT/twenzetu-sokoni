import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AiLearningService } from '../learning/ai-learning.service';

@Injectable()
export class AiQuotaService {
  private readonly logger = new Logger(AiQuotaService.name);
  private readonly dailyLimit = Number(process.env.AI_DAILY_QUOTA_PER_TENANT ?? '1000');
  private readonly cache = new Map<string, { count: number; day: string }>();

  constructor(private readonly learningService: AiLearningService) {}

  public async assertQuota(tenantId: string): Promise<void> {
    if (!tenantId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) return;
    const day = new Date().toISOString().slice(0, 10);
    const key = `${tenantId}:${day}`;
    const cached = this.cache.get(key);
    if (cached && cached.day === day && cached.count >= this.dailyLimit) {
      throw new HttpException(`AI daily quota exceeded (${this.dailyLimit}/day)`, HttpStatus.TOO_MANY_REQUESTS);
    }
    // Use learning service to count today; fallback to 0 on error
    let count = cached?.count ?? 0;
    try {
      const insights = await this.learningService.getInsights(tenantId, 1);
      // insights.byModule total for today is sum of counts; use that as approximation
      const todayCount = insights.byModule.reduce((s, r) => s + r.count, 0);
      // If insights says more than cached, update
      if (todayCount > count) count = todayCount;
    } catch (e) {
      this.logger.warn(`quota check failed for ${tenantId}: ${(e as Error).message}`);
    }
    if (count >= this.dailyLimit) {
      this.cache.set(key, { count, day });
      throw new HttpException(`AI daily quota exceeded (${this.dailyLimit}/day)`, HttpStatus.TOO_MANY_REQUESTS);
    }
    // Increment cache optimistically; will be corrected on next insights fetch
    this.cache.set(key, { count: count + 1, day });
  }
}
