import { CommandBase } from '@afri-market/kernel';

export class SendOtpCommand extends CommandBase {
  constructor(public readonly phoneNumber: string) {
    super();
  }
}
