/**
 * Auto-tune — nightly cron that reads self-learner insights and suggests
 * builder tightening when feedbackDown is high.
 *
 * Does not mutate code; it logs actionable suggestions for the team to
 * review in AdminAiInsights. Keeps the AI self-learning without risky
 * auto-edits.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AiLearningService } from './ai-learning.service';

@Injectable()
export class AiAutoTuneService {
  private readonly logger = new Logger(AiAutoTuneService.name);
  constructor(private readonly learningService: AiLearningService) {}

  @Cron('0 3 * * *')
  public async nightlyTune(): Promise<void> {
    await this.tune(7);
  }

  public async tune(days = 7): Promise<Array<{ module: string; feedbackDown: number; suggestion: string }>> {
    const tenants = await this.distinctTenants();
    const suggestions: Array<{ module: string; feedbackDown: number; suggestion: string }> = [];
    for (const tenantId of tenants) {
      try {
        const insights = await this.learningService.getInsights(tenantId, days);
        for (const row of insights.byModule) {
          if (row.feedbackDown >= 3) {
            const msg = `Module "${row.module}" has ${row.feedbackDown} 👎 in ${days}d (count ${row.count}). Consider tightening its builder constraints or adding a tool.`;
            suggestions.push({ module: row.module, feedbackDown: row.feedbackDown, suggestion: msg });
            this.logger.warn(`[auto-tune] ${msg} tenant=${tenantId}`);
          }
        }
        if (insights.recentFeedbackLow.length > 0) {
          this.logger.log(`[auto-tune] ${insights.recentFeedbackLow.length} recent 👎 for tenant ${tenantId}: ${insights.recentFeedbackLow.map((r) => `${r.module}:${r.message.slice(0, 40)}`).join(' | ')}`);
        }
      } catch (e) {
        this.logger.warn(`auto-tune failed for tenant ${tenantId}: ${(e as Error).message}`);
      }
    }
    if (suggestions.length === 0) this.logger.log(`[auto-tune] no tuning needed (checked ${tenants.length} tenants, ${days}d)`);
    return suggestions;
  }

  private async distinctTenants(): Promise<string[]> {
    try {
      return await this.learningService.distinctTenants(20);
    } catch {
      return [];
    }
  }
}
