import {
  ORGANIZATION_COMMAND_HANDLERS,
  ORGANIZATION_QUERY_HANDLERS,
} from '@abms/organization-infrastructure';
import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationProfileController } from './organization-profile.controller';

@Module({
  controllers: [OrganizationController, OrganizationProfileController],
  providers: [...ORGANIZATION_COMMAND_HANDLERS, ...ORGANIZATION_QUERY_HANDLERS],
})
export class OrganizationModule {}
