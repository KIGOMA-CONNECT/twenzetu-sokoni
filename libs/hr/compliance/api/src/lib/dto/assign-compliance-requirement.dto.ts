import { IsDateString } from 'class-validator';

export class AssignComplianceRequirementDto {
  @IsDateString()
  public dueDate!: string;
}
