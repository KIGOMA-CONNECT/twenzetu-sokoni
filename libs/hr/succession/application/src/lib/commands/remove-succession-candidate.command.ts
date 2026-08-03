import { ICommand } from '@abms/kernel';

export class RemoveSuccessionCandidateCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly successionCandidateId: string) {}
}
