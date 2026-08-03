import { ICommand } from '@abms/kernel';

export interface RegisterCandidateResult {
  readonly id: string;
}

export class RegisterCandidateCommand implements ICommand<RegisterCandidateResult> {
  public readonly _resultType?: RegisterCandidateResult;

  public constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly phone?: string | null,
    public readonly resumeUrl?: string | null,
    public readonly source?: string | null,
  ) {}
}
