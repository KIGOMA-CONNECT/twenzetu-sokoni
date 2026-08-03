import { ICommand } from '@abms/kernel';

export type CourseCategoryInput = 'COMPLIANCE' | 'TECHNICAL' | 'LEADERSHIP' | 'SOFT_SKILLS' | 'OTHER';

export interface CreateCourseResult {
  readonly id: string;
}

export class CreateCourseCommand implements ICommand<CreateCourseResult> {
  public readonly _resultType?: CreateCourseResult;

  public constructor(
    public readonly title: string,
    public readonly durationHours: number,
    public readonly category: CourseCategoryInput,
    public readonly description?: string | null,
  ) {}
}
