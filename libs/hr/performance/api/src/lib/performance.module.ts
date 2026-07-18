import {
  HR_PERFORMANCE_COMMAND_HANDLERS,
  HR_PERFORMANCE_QUERY_HANDLERS,
} from '@abms/hr-performance-infrastructure';
import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';

@Module({
  controllers: [PerformanceController],
  providers: [...HR_PERFORMANCE_COMMAND_HANDLERS, ...HR_PERFORMANCE_QUERY_HANDLERS],
})
export class PerformanceModule {}
