import { ICommand } from '@abms/kernel';

export interface EnrollInCourseResult {
  readonly id: string;
}

export class EnrollInCourseCommand implements ICommand<EnrollInCourseResult> {
  public readonly _resultType?: EnrollInCourseResult;

  public constructor(
    public readonly employeeId: string,
    public readonly courseId: string,
    public readonly enrolledDate: string,
  ) {}
}
