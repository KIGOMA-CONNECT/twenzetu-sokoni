import { ICommand } from '@abms/kernel';
import { VerificationLevelInput } from './upgrade-driver-verification.command';

export class UpgradeFleetOwnerVerificationCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly fleetOwnerId: string,
    public readonly verificationLevel: VerificationLevelInput,
  ) {}
}
