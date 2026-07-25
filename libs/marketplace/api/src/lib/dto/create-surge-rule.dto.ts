import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSurgeRuleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(['DEMAND_SUPPLY', 'WEATHER', 'TRAFFIC', 'NIGHT_TIME', 'EVENT', 'HOLIDAY'])
  trigger!: string;

  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  multiplier!: number;

  @IsInt()
  @IsOptional()
  minOrders?: number;

  @IsInt()
  @IsOptional()
  maxDrivers?: number;

  @IsInt()
  @Min(0)
  @Max(23)
  @IsOptional()
  startHour?: number;

  @IsInt()
  @Min(0)
  @Max(23)
  @IsOptional()
  endHour?: number;
}
