import { CommandBase } from '@afri-market/kernel';
import { UserRole } from '@afri-market/identity-domain';

export class RegisterUserCommand extends CommandBase {
  constructor(
    public readonly phoneNumber: string,
    public readonly fullName: string,
    public readonly role: UserRole,
    public readonly password: string,
    public readonly email?: string,
  ) {
    super();
  }
}
