import { ICommand } from '@abms/kernel';

export class DeactivateCourseCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(public readonly courseId: string) {}
}
