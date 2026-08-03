import { IsString, MinLength } from 'class-validator';

export class MarkComplianceRecordExemptDto {
  @IsString()
  @MinLength(1)
  public reason!: string;
}
