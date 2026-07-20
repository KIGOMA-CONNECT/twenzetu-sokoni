import { IsDateString } from 'class-validator';

export class MarkComplianceRecordCompliantDto {
  @IsDateString()
  public completedDate!: string;
}
