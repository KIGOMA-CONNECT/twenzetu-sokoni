import { ICommand } from '@abms/kernel';

export type ComplianceCategoryInput = 'SAFETY' | 'LEGAL' | 'CERTIFICATION' | 'TRAINING' | 'OTHER';
export type ComplianceRecurrenceInput = 'ONE_TIME' | 'QUARTERLY' | 'ANNUAL' | 'BIENNIAL';

export interface CreateComplianceRequirementResult {
  readonly id: string;
}

export class CreateComplianceRequirementCommand implements ICommand<CreateComplianceRequirementResult> {
  public readonly _resultType?: CreateComplianceRequirementResult;

  public constructor(
    public readonly name: string,
    public readonly category: ComplianceCategoryInput,
    public readonly recurrence: ComplianceRecurrenceInput,
    public readonly description?: string | null,
  ) {}
}
