import { CommandBase } from '@afri-market/kernel';

export class RegisterTenantCommand extends CommandBase {
  constructor(public readonly name: string) {
    super();
  }
}
