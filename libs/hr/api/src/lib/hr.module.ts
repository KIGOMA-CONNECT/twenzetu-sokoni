import { HR_COMMAND_HANDLERS, HR_QUERY_HANDLERS } from '@abms/hr-infrastructure';
import { Module } from '@nestjs/common';
import { HrController } from './hr.controller';

@Module({
  controllers: [HrController],
  providers: [...HR_COMMAND_HANDLERS, ...HR_QUERY_HANDLERS],
})
export class HrModule {}
