export interface PerformanceReviewReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly reviewCycleId: string;
  readonly reviewerUserId: string;
  readonly rating: number | null;
  readonly comments: string | null;
  readonly status: string;
  readonly submittedAt: string | null;
  readonly acknowledgedAt: string | null;
}
