import { ICommand } from '@abms/kernel';

export type OffboardingExitReasonInput =
  | 'RESIGNATION'
  | 'TERMINATION'
  | 'RETIREMENT'
  | 'END_OF_CONTRACT'
  | 'OTHER';

export interface InitiateOffboardingResult {
  readonly id: string;
}

export class InitiateOffboardingCommand implements ICommand<InitiateOffboardingResult> {
  public readonly _resultType?: InitiateOffboardingResult;

  public constructor(
    public readonly employeeId: string,
    public readonly exitReason: OffboardingExitReasonInput,
    public readonly lastWorkingDay: string,
  ) {}
}
