import { CloseSuccessionPlanHandler } from './handlers/close-succession-plan.handler';
import { ListCandidatesForPlanHandler } from './handlers/list-candidates-for-plan.handler';
import { ListSuccessionPlansHandler } from './handlers/list-succession-plans.handler';
import { NominateSuccessionCandidateHandler } from './handlers/nominate-succession-candidate.handler';
import { OpenSuccessionPlanHandler } from './handlers/open-succession-plan.handler';
import { RemoveSuccessionCandidateHandler } from './handlers/remove-succession-candidate.handler';
import { UpdateCandidateReadinessHandler } from './handlers/update-candidate-readiness.handler';

export const HR_SUCCESSION_COMMAND_HANDLERS = [
  OpenSuccessionPlanHandler,
  CloseSuccessionPlanHandler,
  NominateSuccessionCandidateHandler,
  UpdateCandidateReadinessHandler,
  RemoveSuccessionCandidateHandler,
];

export const HR_SUCCESSION_QUERY_HANDLERS = [ListSuccessionPlansHandler, ListCandidatesForPlanHandler];
