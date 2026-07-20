import {
  HR_SUCCESSION_COMMAND_HANDLERS,
  HR_SUCCESSION_QUERY_HANDLERS,
} from '@abms/hr-succession-infrastructure';
import { Module } from '@nestjs/common';
import { SuccessionController } from './succession.controller';

@Module({
  controllers: [SuccessionController],
  providers: [...HR_SUCCESSION_COMMAND_HANDLERS, ...HR_SUCCESSION_QUERY_HANDLERS],
})
export class SuccessionModule {}
