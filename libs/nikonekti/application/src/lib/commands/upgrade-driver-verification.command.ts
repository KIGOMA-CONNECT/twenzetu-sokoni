import { ICommand } from '@abms/kernel';

export type VerificationLevelInput = 'UNVERIFIED' | 'PHONE_VERIFIED' | 'KYC_VERIFIED';

export class UpgradeDriverVerificationCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly driverId: string,
    public readonly verificationLevel: VerificationLevelInput,
  ) {}
}
