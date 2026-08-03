import { BenefitEnrollmentOrmEntity } from './entities/benefit-enrollment-orm.entity';
import { BenefitPlanOrmEntity } from './entities/benefit-plan-orm.entity';
import { SalaryRevisionOrmEntity } from './entities/salary-revision-orm.entity';

export const HR_COMPENSATION_ENTITIES = [
  SalaryRevisionOrmEntity,
  BenefitPlanOrmEntity,
  BenefitEnrollmentOrmEntity,
];
