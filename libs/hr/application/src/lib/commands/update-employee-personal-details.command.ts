import { ICommand } from '@abms/kernel';

export class UpdateEmployeePersonalDetailsCommand implements ICommand<void> {
  public readonly _resultType?: void;

  public constructor(
    public readonly employeeId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly email?: string,
    public readonly phone?: string | null,
    public readonly dateOfBirth?: string | null,
    public readonly gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null,
  ) {}
}
