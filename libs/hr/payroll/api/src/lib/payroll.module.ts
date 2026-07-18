import { HR_PAYROLL_COMMAND_HANDLERS, HR_PAYROLL_QUERY_HANDLERS } from '@abms/hr-payroll-infrastructure';
import { Module } from '@nestjs/common';
import { PayrollController } from './payroll.controller';

@Module({
  controllers: [PayrollController],
  providers: [...HR_PAYROLL_COMMAND_HANDLERS, ...HR_PAYROLL_QUERY_HANDLERS],
})
export class PayrollModule {}
