import { IsUUID } from 'class-validator';

export class SubmitApplicationDto {
  @IsUUID('4')
  public candidateId!: string;

  @IsUUID('4')
  public jobRequisitionId!: string;
}
