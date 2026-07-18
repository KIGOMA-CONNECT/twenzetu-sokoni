import { IsDateString, IsString, MinLength } from 'class-validator';

export class OpenReviewCycleDto {
  @IsString()
  @MinLength(1)
  public name!: string;

  @IsDateString()
  public startDate!: string;

  @IsDateString()
  public endDate!: string;
}
