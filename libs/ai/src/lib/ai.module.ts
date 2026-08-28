/**
 * Nest module for the AI layer. Feature modules import AiModule to inject
 * AiService (and, when needed, the tool/context registries are importable
 * directly as plain functions).
 */

import { Module } from '@nestjs/common';
import { AiService } from './service/ai.service';

@Module({
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
