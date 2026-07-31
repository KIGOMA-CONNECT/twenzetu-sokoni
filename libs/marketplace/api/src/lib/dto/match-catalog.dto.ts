import { IsArray, ArrayMinSize, IsString } from 'class-validator';

export class MatchCatalogDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  public items!: string[];
}
