import { IsArray, IsDateString, IsNumber, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AllowanceDto {
  @IsString()
  public name!: string;

  @IsNumber()
  @Min(0)
  public amount!: number;
}

export class SetSalaryStructureDto {
  @IsNumber()
  @Min(0)
  public basicSalary!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllowanceDto)
  public allowances!: AllowanceDto[];

  @IsDateString()
  public effectiveFrom!: string;
}
