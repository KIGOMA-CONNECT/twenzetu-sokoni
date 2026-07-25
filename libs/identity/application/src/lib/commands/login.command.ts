import { CommandBase } from '@afri-market/kernel';

export class LoginCommand extends CommandBase {
  constructor(
    public readonly phoneNumber: string,
    public readonly password: string,
  ) {
    super();
  }
}
