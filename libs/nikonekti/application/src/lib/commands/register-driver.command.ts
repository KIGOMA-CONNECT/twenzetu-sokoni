import { ICommand } from '@abms/kernel';

export interface RegisterDriverResult {
  readonly id: string;
}

export class RegisterDriverCommand implements ICommand<RegisterDriverResult> {
  public readonly _resultType?: RegisterDriverResult;

  public constructor(
    public readonly fullName: string,
    public readonly phone: string,
    public readonly licenseNumber: string,
  ) {}
}
