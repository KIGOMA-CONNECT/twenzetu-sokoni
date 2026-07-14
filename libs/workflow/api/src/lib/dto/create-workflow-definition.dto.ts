import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkflowDefinitionDto {
  @IsString()
  @IsNotEmpty()
  public code!: string;

  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  public approverRoles!: string[];
}
