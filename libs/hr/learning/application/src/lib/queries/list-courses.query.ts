import { IQuery } from '@abms/kernel';
import { CourseReadModel } from '../read-models/course-read-model';

export class ListCoursesQuery implements IQuery<CourseReadModel[]> {
  public readonly _resultType?: CourseReadModel[];
}
