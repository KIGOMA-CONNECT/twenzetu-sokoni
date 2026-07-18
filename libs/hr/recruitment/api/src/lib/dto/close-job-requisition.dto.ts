import { IsIn } from 'class-validator';

const CLOSE_REASONS = ['FILLED', 'CANCELLED'] as const;

export class CloseJobRequisitionDto {
  @IsIn(CLOSE_REASONS)
  public reason!: (typeof CLOSE_REASONS)[number];
}
