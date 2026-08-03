import { IsDateString } from 'class-validator';

export class EnrollInCourseDto {
  @IsDateString()
  public enrolledDate!: string;
}
