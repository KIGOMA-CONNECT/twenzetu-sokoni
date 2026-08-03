import { IsUUID } from 'class-validator';

export class StartPerformanceReviewDto {
  @IsUUID()
  public employeeId!: string;
}
