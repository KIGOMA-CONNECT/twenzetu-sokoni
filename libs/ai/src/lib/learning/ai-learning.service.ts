/**
 * Self-learner — captures every AI interaction and derives insights
 * from how the system is actually used.
 *
 * - logInteraction() is called by AiService after each complete/stream.
 * - submitFeedback() records thumbs up/down.
 * - getInsights() aggregates by module/feature, feedback ratio, latency,
 *   and surfaces what the AI should learn (e.g., "vendor-analytics low-stock
 *   questions are frequent but feedback is low — tighten that builder").
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiInteractionOrmEntity } from './ai-interaction.entity';

@Injectable()
export class AiLearningService {
  private readonly logger = new Logger(AiLearningService.name);
  constructor(
    @InjectRepository(AiInteractionOrmEntity)
    private readonly repo: Repository<AiInteractionOrmEntity>,
  ) {}

  public async logInteraction(params: {
    tenantId: string;
    userId?: string | null;
    module: string;
    feature?: string | null;
    message: string;
    response?: string | null;
    contextSummary?: string | null;
    latencyMs?: number | null;
    provider?: string | null;
  }): Promise<AiInteractionOrmEntity> {
    try {
      const entity = this.repo.create({
        tenantId: params.tenantId,
        userId: params.userId ?? null,
        module: params.module.toLowerCase(),
        feature: params.feature ?? null,
        message: params.message.slice(0, 2000),
        response: params.response ? params.response.slice(0, 8000) : null,
        contextSummary: params.contextSummary ?? null,
        latencyMs: params.latencyMs ?? null,
        provider: params.provider ?? null,
      });
      return await this.repo.save(entity);
    } catch (e) {
      this.logger.warn(`logInteraction failed: ${(e as Error).message}`);
      // Return a dummy entity so callers don't have to handle null
      return { id: 'failed', tenantId: params.tenantId } as AiInteractionOrmEntity;
    }
  }

  public async submitFeedback(id: string, tenantId: string, feedback: 'up' | 'down'): Promise<AiInteractionOrmEntity | null> {
    const entity = await this.repo.findOne({ where: { id, tenantId } });
    if (!entity) return null;
    entity.feedback = feedback;
    return this.repo.save(entity);
  }

  public async getInsights(tenantId: string, days = 7): Promise<{
    total: number;
    byModule: Array<{ module: string; count: number; avgLatencyMs: number | null; feedbackUp: number; feedbackDown: number }>;
    byFeature: Array<{ feature: string; count: number }>;
    recentFeedbackLow: Array<{ module: string; feature: string | null; message: string; feedback: string }>;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const total = await this.repo.count({ where: { tenantId } });
    const byModuleRaw: Array<{ module: string; count: string; avgLatencyMs: string | null; feedbackUp: string; feedbackDown: string }> = await this.repo
      .createQueryBuilder('ai')
      .select('ai.module', 'module')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(ai.latencyMs)', 'avgLatencyMs')
      .addSelect(`SUM(CASE WHEN ai.feedback = 'up' THEN 1 ELSE 0 END)`, 'feedbackUp')
      .addSelect(`SUM(CASE WHEN ai.feedback = 'down' THEN 1 ELSE 0 END)`, 'feedbackDown')
      .where('ai.tenantId = :tenantId', { tenantId })
      .andWhere('ai.createdAt >= :since', { since })
      .groupBy('ai.module')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();
    const byModule = byModuleRaw.map((r) => ({
      module: r.module,
      count: Number(r.count),
      avgLatencyMs: r.avgLatencyMs ? Math.round(Number(r.avgLatencyMs)) : null,
      feedbackUp: Number(r.feedbackUp),
      feedbackDown: Number(r.feedbackDown),
    }));
    const byFeatureRaw: Array<{ feature: string; count: string }> = await this.repo
      .createQueryBuilder('ai')
      .select('ai.feature', 'feature')
      .addSelect('COUNT(*)', 'count')
      .where('ai.tenantId = :tenantId', { tenantId })
      .andWhere('ai.createdAt >= :since', { since })
      .andWhere('ai.feature IS NOT NULL')
      .groupBy('ai.feature')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();
    const byFeature = byFeatureRaw.map((r) => ({ feature: r.feature, count: Number(r.count) }));
    const recentFeedbackLow = await this.repo.find({
      where: { tenantId, feedback: 'down' as const } as never,
      order: { createdAt: 'DESC' as const },
      take: 5,
    });
    return {
      total,
      byModule,
      byFeature,
      recentFeedbackLow: recentFeedbackLow.map((e) => ({ module: e.module, feature: e.feature, message: e.message.slice(0, 120), feedback: e.feedback as string })),
    };
  }
}
