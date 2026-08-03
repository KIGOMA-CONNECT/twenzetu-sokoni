export interface CourseEnrollmentReadModel {
  readonly id: string;
  readonly employeeId: string;
  readonly courseId: string;
  readonly enrolledDate: string;
  readonly status: string;
  readonly score: number | null;
  readonly completedDate: string | null;
}
