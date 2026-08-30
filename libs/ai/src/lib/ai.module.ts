/**
 * Nest module for the AI layer. Feature modules import AiModule to inject
 * AiService (and, when needed, the tool/context registries are importable
 * directly as plain functions).
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './service/ai.service';
import { AiAgent } from './agent/ai-agent';
import { AiInteractionOrmEntity } from './learning/ai-interaction.entity';
import { AiLearningService } from './learning/ai-learning.service';
import { AiAutoTuneService } from './learning/ai-auto-tune.service';
import { AiQuotaService } from './quota/ai-quota.service';
import { AiMetricsService } from './metrics/ai-metrics.service';
import './context/builders';

@Module({
  imports: [TypeOrmModule.forFeature([AiInteractionOrmEntity])],
  providers: [AiService, AiAgent, AiLearningService, AiAutoTuneService, AiQuotaService, AiMetricsService],
  exports: [AiService, AiAgent, AiLearningService, AiAutoTuneService, AiQuotaService, AiMetricsService],
})
export class AiModule {}
