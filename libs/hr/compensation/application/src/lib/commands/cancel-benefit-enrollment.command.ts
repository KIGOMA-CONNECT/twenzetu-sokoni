import { ICommand } from '@abms/kernel';

export class CancelBenefitEnrollmentCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly benefitEnrollmentId: string) {}
}
