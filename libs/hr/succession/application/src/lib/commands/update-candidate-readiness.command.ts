import { ICommand } from '@abms/kernel';
import { ReadinessLevelInput } from './nominate-succession-candidate.command';

export class UpdateCandidateReadinessCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly successionCandidateId: string,
    public readonly readinessLevel: ReadinessLevelInput,
    public readonly notes?: string | null,
  ) {}
}
