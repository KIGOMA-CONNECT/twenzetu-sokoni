export interface CourseReadModel {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly durationHours: number;
  readonly category: string;
  readonly isActive: boolean;
}
