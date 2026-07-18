import {
  GoalReadModel,
  PerformanceReviewReadModel,
  ReviewCycleReadModel,
} from '@abms/hr-performance-application';
import { Goal, PerformanceReview, ReviewCycle } from '@abms/hr-performance-domain';

export function toGoalReadModel(goal: Goal): GoalReadModel {
  return {
    id: goal.id.toValue(),
    employeeId: goal.employeeId.toValue(),
    title: goal.title,
    description: goal.description,
    targetDate: goal.targetDate.toISOString().slice(0, 10),
    status: goal.status,
    progressPercent: goal.progressPercent,
  };
}

export function toReviewCycleReadModel(cycle: ReviewCycle): ReviewCycleReadModel {
  return {
    id: cycle.id.toValue(),
    name: cycle.name,
    startDate: cycle.startDate.toISOString().slice(0, 10),
    endDate: cycle.endDate.toISOString().slice(0, 10),
    status: cycle.status,
  };
}

export function toPerformanceReviewReadModel(review: PerformanceReview): PerformanceReviewReadModel {
  return {
    id: review.id.toValue(),
    employeeId: review.employeeId.toValue(),
    reviewCycleId: review.reviewCycleId.toValue(),
    reviewerUserId: review.reviewerUserId,
    rating: review.rating,
    comments: review.comments,
    status: review.status,
    submittedAt: review.submittedAt?.toISOString() ?? null,
    acknowledgedAt: review.acknowledgedAt?.toISOString() ?? null,
  };
}
