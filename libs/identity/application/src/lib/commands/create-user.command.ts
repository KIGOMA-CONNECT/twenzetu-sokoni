import { ICommand } from '@abms/kernel';

export interface CreateUserResult {
  readonly id: string;
}

export class CreateUserCommand implements ICommand<CreateUserResult> {
  public readonly _resultType?: CreateUserResult;

  // tenantId comes from the authenticated caller's JWT (request.user.tenantId),
  // never from the request body — a CEO must not be able to specify an
  // arbitrary tenant to create a user under.
  public constructor(
    public readonly tenantId: string,
    public readonly email: string,
    public readonly password: string,
    public readonly role: string,
  ) {}
}
