import { IsDateString } from 'class-validator';

export class TerminateEmployeeDto {
  @IsDateString()
  public terminationDate!: string;
}
