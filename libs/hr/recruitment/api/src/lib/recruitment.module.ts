import {
  HR_RECRUITMENT_COMMAND_HANDLERS,
  HR_RECRUITMENT_QUERY_HANDLERS,
} from '@abms/hr-recruitment-infrastructure';
import { Module } from '@nestjs/common';
import { RecruitmentController } from './recruitment.controller';

@Module({
  controllers: [RecruitmentController],
  providers: [...HR_RECRUITMENT_COMMAND_HANDLERS, ...HR_RECRUITMENT_QUERY_HANDLERS],
})
export class RecruitmentModule {}
