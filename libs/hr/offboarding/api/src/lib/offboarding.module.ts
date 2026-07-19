import {
  HR_OFFBOARDING_COMMAND_HANDLERS,
  HR_OFFBOARDING_QUERY_HANDLERS,
} from '@abms/hr-offboarding-infrastructure';
import { Module } from '@nestjs/common';
import { OffboardingController } from './offboarding.controller';

@Module({
  controllers: [OffboardingController],
  providers: [...HR_OFFBOARDING_COMMAND_HANDLERS, ...HR_OFFBOARDING_QUERY_HANDLERS],
})
export class OffboardingModule {}
