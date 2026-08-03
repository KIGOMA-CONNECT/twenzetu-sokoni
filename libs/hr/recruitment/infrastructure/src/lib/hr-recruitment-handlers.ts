import { AdvanceToInterviewingHandler } from './handlers/advance-to-interviewing.handler';
import { AdvanceToScreeningHandler } from './handlers/advance-to-screening.handler';
import { CloseJobRequisitionHandler } from './handlers/close-job-requisition.handler';
import { CompleteOnboardingTaskHandler } from './handlers/complete-onboarding-task.handler';
import { GetApplicationByIdHandler } from './handlers/get-application-by-id.handler';
import { HireCandidateHandler } from './handlers/hire-candidate.handler';
import { ListApplicationsForCandidateHandler } from './handlers/list-applications-for-candidate.handler';
import { ListApplicationsForRequisitionHandler } from './handlers/list-applications-for-requisition.handler';
import { ListCandidatesHandler } from './handlers/list-candidates.handler';
import { ListJobRequisitionsHandler } from './handlers/list-job-requisitions.handler';
import { ListOnboardingTasksForEmployeeHandler } from './handlers/list-onboarding-tasks-for-employee.handler';
import { MakeOfferHandler } from './handlers/make-offer.handler';
import { OpenJobRequisitionHandler } from './handlers/open-job-requisition.handler';
import { RegisterCandidateHandler } from './handlers/register-candidate.handler';
import { RejectApplicationHandler } from './handlers/reject-application.handler';
import { SubmitApplicationHandler } from './handlers/submit-application.handler';
import { WithdrawApplicationHandler } from './handlers/withdraw-application.handler';

export const HR_RECRUITMENT_COMMAND_HANDLERS = [
  OpenJobRequisitionHandler,
  CloseJobRequisitionHandler,
  RegisterCandidateHandler,
  SubmitApplicationHandler,
  AdvanceToScreeningHandler,
  AdvanceToInterviewingHandler,
  MakeOfferHandler,
  HireCandidateHandler,
  RejectApplicationHandler,
  WithdrawApplicationHandler,
  CompleteOnboardingTaskHandler,
];

export const HR_RECRUITMENT_QUERY_HANDLERS = [
  ListJobRequisitionsHandler,
  ListCandidatesHandler,
  ListApplicationsForRequisitionHandler,
  ListApplicationsForCandidateHandler,
  GetApplicationByIdHandler,
  ListOnboardingTasksForEmployeeHandler,
];
