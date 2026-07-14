import { ICommand } from '@abms/kernel';

export interface LoginResult {
  readonly accessToken: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly role: string;
}

export class LoginCommand implements ICommand<LoginResult> {
  public readonly _resultType?: LoginResult;

  public constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}
