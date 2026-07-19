import { CancelBenefitEnrollmentHandler } from './handlers/cancel-benefit-enrollment.handler';
import { CreateBenefitPlanHandler } from './handlers/create-benefit-plan.handler';
import { DeactivateBenefitPlanHandler } from './handlers/deactivate-benefit-plan.handler';
import { EnrollInBenefitHandler } from './handlers/enroll-in-benefit.handler';
import { ListBenefitEnrollmentsForEmployeeHandler } from './handlers/list-benefit-enrollments-for-employee.handler';
import { ListBenefitPlansHandler } from './handlers/list-benefit-plans.handler';
import { ListSalaryRevisionsForEmployeeHandler } from './handlers/list-salary-revisions-for-employee.handler';
import { RecordSalaryRevisionHandler } from './handlers/record-salary-revision.handler';

export const HR_COMPENSATION_COMMAND_HANDLERS = [
  RecordSalaryRevisionHandler,
  CreateBenefitPlanHandler,
  DeactivateBenefitPlanHandler,
  EnrollInBenefitHandler,
  CancelBenefitEnrollmentHandler,
];

export const HR_COMPENSATION_QUERY_HANDLERS = [
  ListSalaryRevisionsForEmployeeHandler,
  ListBenefitPlansHandler,
  ListBenefitEnrollmentsForEmployeeHandler,
];
