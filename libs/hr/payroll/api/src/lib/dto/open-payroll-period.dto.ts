import { IsInt, Max, Min } from 'class-validator';

export class OpenPayrollPeriodDto {
  @IsInt()
  @Min(2000)
  @Max(2200)
  public year!: number;

  @IsInt()
  @Min(1)
  @Max(12)
  public month!: number;
}
