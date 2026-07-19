import { ICommand } from '@abms/kernel';

export class CompleteCourseEnrollmentCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly courseEnrollmentId: string,
    public readonly completedDate: string,
    public readonly score?: number | null,
  ) {}
}
