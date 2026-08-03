import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class StartWorkflowDto {
  @IsUUID('4')
  public workflowDefinitionId!: string;

  @IsString()
  @IsNotEmpty()
  public subjectType!: string;

  @IsString()
  @IsNotEmpty()
  public subjectId!: string;
}
