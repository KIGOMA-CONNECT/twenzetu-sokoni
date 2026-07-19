import { IsDateString, IsIn } from 'class-validator';

const EXIT_REASONS = ['RESIGNATION', 'TERMINATION', 'RETIREMENT', 'END_OF_CONTRACT', 'OTHER'] as const;

export class InitiateOffboardingDto {
  @IsIn(EXIT_REASONS)
  public exitReason!: (typeof EXIT_REASONS)[number];

  @IsDateString()
  public lastWorkingDay!: string;
}
