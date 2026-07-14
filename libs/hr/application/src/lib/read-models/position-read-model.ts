export interface PositionReadModel {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly isActive: boolean;
}
