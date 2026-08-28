import { Module } from '@nestjs/common';
import { AiModule } from '@afri-market/ai';
import { AiController } from './ai.controller';

@Module({
  imports: [AiModule],
  controllers: [AiController],
})
export class AiApiModule {}
