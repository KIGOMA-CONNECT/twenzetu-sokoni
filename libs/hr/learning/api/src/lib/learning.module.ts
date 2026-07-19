import { HR_LEARNING_COMMAND_HANDLERS, HR_LEARNING_QUERY_HANDLERS } from '@abms/hr-learning-infrastructure';
import { Module } from '@nestjs/common';
import { LearningController } from './learning.controller';

@Module({
  controllers: [LearningController],
  providers: [...HR_LEARNING_COMMAND_HANDLERS, ...HR_LEARNING_QUERY_HANDLERS],
})
export class LearningModule {}
