import { ApplicationOrmEntity } from './entities/application-orm.entity';
import { CandidateOrmEntity } from './entities/candidate-orm.entity';
import { JobRequisitionOrmEntity } from './entities/job-requisition-orm.entity';
import { OnboardingTaskOrmEntity } from './entities/onboarding-task-orm.entity';

export const HR_RECRUITMENT_ENTITIES = [
  JobRequisitionOrmEntity,
  CandidateOrmEntity,
  ApplicationOrmEntity,
  OnboardingTaskOrmEntity,
];
