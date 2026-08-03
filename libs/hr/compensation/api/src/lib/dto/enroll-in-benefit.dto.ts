import { IsDateString } from 'class-validator';

export class EnrollInBenefitDto {
  @IsDateString()
  public effectiveDate!: string;
}
