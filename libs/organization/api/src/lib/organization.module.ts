import {
  ORGANIZATION_COMMAND_HANDLERS,
  ORGANIZATION_QUERY_HANDLERS,
} from '@abms/organization-infrastructure';
import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';

@Module({
  controllers: [OrganizationController],
  providers: [...ORGANIZATION_COMMAND_HANDLERS, ...ORGANIZATION_QUERY_HANDLERS],
})
export class OrganizationModule {}
