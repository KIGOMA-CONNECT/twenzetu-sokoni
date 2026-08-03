import { ICommand } from '@abms/kernel';

export class CancelCourseEnrollmentCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly courseEnrollmentId: string) {}
}
