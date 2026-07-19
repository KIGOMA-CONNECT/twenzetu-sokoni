import { CancelOffboardingHandler } from './handlers/cancel-offboarding.handler';
import { CompleteOffboardingHandler } from './handlers/complete-offboarding.handler';
import { CompleteOffboardingTaskHandler } from './handlers/complete-offboarding-task.handler';
import { GetOffboardingCaseByIdHandler } from './handlers/get-offboarding-case-by-id.handler';
import { InitiateOffboardingHandler } from './handlers/initiate-offboarding.handler';
import { ListOffboardingCasesHandler } from './handlers/list-offboarding-cases.handler';
import { ListOffboardingTasksForCaseHandler } from './handlers/list-offboarding-tasks-for-case.handler';

export const HR_OFFBOARDING_COMMAND_HANDLERS = [
  InitiateOffboardingHandler,
  CompleteOffboardingHandler,
  CancelOffboardingHandler,
  CompleteOffboardingTaskHandler,
];

export const HR_OFFBOARDING_QUERY_HANDLERS = [
  GetOffboardingCaseByIdHandler,
  ListOffboardingCasesHandler,
  ListOffboardingTasksForCaseHandler,
];
