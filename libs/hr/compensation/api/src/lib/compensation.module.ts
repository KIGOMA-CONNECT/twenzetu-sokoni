import {
  HR_COMPENSATION_COMMAND_HANDLERS,
  HR_COMPENSATION_QUERY_HANDLERS,
} from '@abms/hr-compensation-infrastructure';
import { Module } from '@nestjs/common';
import { CompensationController } from './compensation.controller';

@Module({
  controllers: [CompensationController],
  providers: [...HR_COMPENSATION_COMMAND_HANDLERS, ...HR_COMPENSATION_QUERY_HANDLERS],
})
export class CompensationModule {}
