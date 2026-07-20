export interface ComplianceRequirementReadModel {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly category: string;
  readonly recurrence: string;
  readonly isActive: boolean;
}
