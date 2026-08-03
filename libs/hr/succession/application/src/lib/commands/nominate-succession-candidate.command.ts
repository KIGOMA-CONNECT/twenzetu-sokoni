import { ICommand } from '@abms/kernel';

export type ReadinessLevelInput = 'READY_NOW' | 'READY_1_2_YEARS' | 'READY_3_5_YEARS' | 'NOT_READY';

export interface NominateSuccessionCandidateResult {
  readonly id: string;
}

export class NominateSuccessionCandidateCommand implements ICommand<NominateSuccessionCandidateResult> {
  public readonly _resultType?: NominateSuccessionCandidateResult;

  public constructor(
    public readonly successionPlanId: string,
    public readonly employeeId: string,
    public readonly readinessLevel: ReadinessLevelInput,
    public readonly notes?: string | null,
  ) {}
}
