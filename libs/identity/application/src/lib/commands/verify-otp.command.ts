import { CommandBase } from '@afri-market/kernel';

export class VerifyOtpCommand extends CommandBase {
  constructor(
    public readonly phoneNumber: string,
    public readonly code: string,
  ) {
    super();
  }
}
