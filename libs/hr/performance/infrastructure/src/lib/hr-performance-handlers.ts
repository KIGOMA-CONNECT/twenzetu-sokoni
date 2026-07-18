import { AcknowledgePerformanceReviewHandler } from './handlers/acknowledge-performance-review.handler';
import { CancelGoalHandler } from './handlers/cancel-goal.handler';
import { CloseReviewCycleHandler } from './handlers/close-review-cycle.handler';
import { CompleteGoalHandler } from './handlers/complete-goal.handler';
import { GetPerformanceReviewByIdHandler } from './handlers/get-performance-review-by-id.handler';
import { ListGoalsForEmployeeHandler } from './handlers/list-goals-for-employee.handler';
import { ListPerformanceReviewsForCycleHandler } from './handlers/list-performance-reviews-for-cycle.handler';
import { ListPerformanceReviewsForEmployeeHandler } from './handlers/list-performance-reviews-for-employee.handler';
import { ListReviewCyclesHandler } from './handlers/list-review-cycles.handler';
import { OpenReviewCycleHandler } from './handlers/open-review-cycle.handler';
import { SetGoalHandler } from './handlers/set-goal.handler';
import { StartPerformanceReviewHandler } from './handlers/start-performance-review.handler';
import { SubmitPerformanceReviewHandler } from './handlers/submit-performance-review.handler';
import { UpdateGoalProgressHandler } from './handlers/update-goal-progress.handler';

export const HR_PERFORMANCE_COMMAND_HANDLERS = [
  SetGoalHandler,
  UpdateGoalProgressHandler,
  CompleteGoalHandler,
  CancelGoalHandler,
  OpenReviewCycleHandler,
  CloseReviewCycleHandler,
  StartPerformanceReviewHandler,
  SubmitPerformanceReviewHandler,
  AcknowledgePerformanceReviewHandler,
];

export const HR_PERFORMANCE_QUERY_HANDLERS = [
  ListGoalsForEmployeeHandler,
  ListReviewCyclesHandler,
  GetPerformanceReviewByIdHandler,
  ListPerformanceReviewsForEmployeeHandler,
  ListPerformanceReviewsForCycleHandler,
];
