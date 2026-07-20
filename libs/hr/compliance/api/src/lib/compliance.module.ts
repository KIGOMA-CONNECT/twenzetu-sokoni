import { HR_COMPLIANCE_COMMAND_HANDLERS, HR_COMPLIANCE_QUERY_HANDLERS } from '@abms/hr-compliance-infrastructure';
import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';

@Module({
  controllers: [ComplianceController],
  providers: [...HR_COMPLIANCE_COMMAND_HANDLERS, ...HR_COMPLIANCE_QUERY_HANDLERS],
})
export class ComplianceModule {}
