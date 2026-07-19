import { IQuery } from '@abms/kernel';
import { CourseEnrollmentReadModel } from '../read-models/course-enrollment-read-model';

export class ListCourseEnrollmentsForEmployeeQuery implements IQuery<CourseEnrollmentReadModel[]> {
  public readonly _resultType?: CourseEnrollmentReadModel[];

  public constructor(public readonly employeeId: string) {}
}
